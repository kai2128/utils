/* eslint-disable no-console */
import { setStatusText, useSessionStorage } from '.'

interface TaskHandlerOptions {
  serverUrl: string
  type: string
  username: string | (() => string)
}

export function useTaskHandler(options: TaskHandlerOptions, { prepareForTask = () => { }, processTaskHandler = () => { }, registerCustomEvent = () => { } }: { prepareForTask?: (task: any) => void, processTaskHandler?: (task: any) => void | Promise<void>, registerCustomEvent?: (eventSource: EventSource) => void } = {}) {
  const { serverUrl, type } = options
  let eventSource: EventSource | null = null
  function getUsername() {
    if (typeof options.username === 'function')
      return options.username()

    return options.username
  }
  let clientId = useSessionStorage().get('client-id')
  let task = useSessionStorage().get('task')

  async function listenMessage() {
    if (task != null)
      return

    const paramsObj = {
      type,
      id: clientId,
      username: getUsername(),
    }
    const filteredParamsObj = Object.fromEntries(Object.entries(paramsObj).filter(([_, v]) => v != null && v !== '' && v !== undefined))
    const params = new URLSearchParams(filteredParamsObj)
    eventSource = new EventSource(`${serverUrl}/client/listen?${params.toString()}`)

    const taskHandler = (event: any) => {
      eventSource?.close()
      handleTask(event)
    }
    if (clientId)
      eventSource.addEventListener(`client-${clientId}`, taskHandler)

    eventSource.addEventListener('register', (event) => {
      const client = JSON.parse(event.data)
      clientId = client.id
      console.log('registered', clientId)
      useSessionStorage().set('client-id', clientId)
      eventSource?.addEventListener(`client-${clientId}`, taskHandler)
      console.log(`client ${clientId} ${getUsername()} listening for task...`)
      setStatusText(`client ${clientId} ${getUsername()} listening for task...`)
    })
    eventSource.addEventListener('heartbeat', (_event) => {
      // const data = JSON.parse(event.data);
      // console.log('Received message from server:', data);
    })
    if (clientId) {
      console.log(`client ${clientId} ${getUsername()} listening for task...`)
      setStatusText(`client ${clientId} ${getUsername()} listening for task...`)
    }
    //
    if (registerCustomEvent)
      registerCustomEvent(eventSource)
  }

  async function handleTask(event: any) {
    // console.log('handleTask', event.data)
    setStatusText('handle task', event.data)
    const task = JSON.parse(event.data)
    useSessionStorage().set('task', task)
    prepareForTask(task)
  }

  async function processTask() {
    if (task == null)
      return

    console.log(task.payload)
    setStatusText('processing task', task.payload)
    try {
      await processTaskHandler(task)
    }
    catch (e) {
      setStatusText('error process task', e)
    }
    finally {
      task = null
      useSessionStorage().remove('task')
    }
  }

  return {
    start: async () => {
      try {
        const taskExist = useSessionStorage().get('task') !== null
        if (taskExist) {
          await processTask()
          await listenMessage()
        }
        else {
          await listenMessage()
        }
      }
      catch (e) {
        console.error('error process task', e)
        setStatusText('error process task', e)
        task = null
        setTimeout(listenMessage, 5000)
      }
    },
    registerHandler: (preProcessHandler: (task: any) => void, taskHandler: (task: any) => void | Promise<void>) => {
      processTaskHandler = taskHandler
      prepareForTask = preProcessHandler
    },
  }
}
