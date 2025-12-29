/* eslint-disable no-console */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useSessionStorage() {
  return {
    set: (key, value) => {
      const type = Object.prototype.toString.call(value)
      if (type === '[object Object]' || type === '[object Array]')
        value = JSON.stringify(value)

      sessionStorage.setItem(key, value)
    },
    get: (key) => {
      const item = sessionStorage.getItem(key)
      if (!item || item === 'null' || item === 'undefined')
        return null

      try {
        return JSON.parse(item)
      }
      catch {
        return item
      }
    },
    remove: key => sessionStorage.removeItem(key),
  }
}

export async function waitForPageReady(bufferTime = 2000, timeout = 30000) {
  // expect page to be ready in 30 seconds else refresh
  try {
    await new Promise(resolve => setTimeout(resolve, bufferTime)) // wait for some more time for the page load
    await waitUntil(() => document.readyState === 'complete', () => { }, timeout)
  }
  catch (_) {
    console.log(`timeout waiting element, refreshing page...`)
    setTimeout(() => window.location.reload(), 1000)
  }
}

export function waitForSecond(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function waitUntil(condition: () => boolean, action: (() => void) | undefined = undefined, timeout = -1) {
  return new Promise((resolve, reject) => {
    if (condition())
      return resolve(true)

    const interval = setInterval(() => {
      if (action)
        action()
      if (condition()) {
        clearInterval(interval)
        resolve(true)
      }
    }, 1000)

    if (timeout > 0) {
      setTimeout(() => {
        clearInterval(interval)
        reject(new Error('Timeout'))
      }, timeout)
    }
  })
}

export function waitForElms(selector: string) {
  return new Promise((resolve) => {
    if (document.querySelectorAll(selector))
      return resolve(Array.from(document.querySelectorAll(selector)))

    const observer = new MutationObserver(() => {
      if (document.querySelectorAll(selector)) {
        observer.disconnect()
        resolve(Array.from(document.querySelectorAll(selector)))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

export function waitForElm(selector: string, timeout = 0): Promise<Element | null> {
  return new Promise((resolve, reject) => {
    if (timeout > 0) {
      setTimeout(() => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(null)
      }, timeout)
    }

    if (document.querySelector(selector))
      return resolve(document.querySelector(selector))

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve(document.querySelector(selector))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

export async function getInnerText(selector: string) {
  try {
    const elm = await waitForElm(selector, 3000)
    return elm ? elm.textContent : ''
  }
  catch (e) {
    console.error(selector, e)
    return ''
  }
}

export function triggerMouseEvent(node: Node, eventType = 'click') {
  const clickEvent = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: false,
  })
  node.dispatchEvent(clickEvent)
}

export function setStatusText(...text: unknown[]) {
  text = text.map((t) => {
    if (typeof t === 'object')
      return JSON.stringify(t)

    return t
  })
  const status = document.querySelector<HTMLDivElement>('#status')
  if (status) {
    status.textContent = text.join(' ')
  }
  else {
    const status = document.createElement('div')
    const statusText = document.createElement('pre')
    status.style.position = 'fixed'
    status.style.top = '0'
    status.style.right = '0'
    status.style.zIndex = '9999'
    status.style.color = 'red'
    status.id = 'status'
    statusText.textContent = text.join(' ')
    status.appendChild(statusText)
    document.body.appendChild(status)
  }
}

export function useSessionStorage<T>() {
  return {
    set: (key: string, value: T) => {
      const type = Object.prototype.toString.call(value)
      let data
      if (type === '[object Object]' || type === '[object Array]')
        data = JSON.stringify(value)
      else
        data = value
      sessionStorage.setItem(key, data as string)
    },
    get: (key: string) => {
      const item = sessionStorage.getItem(key)
      if (!item || item === 'null' || item === 'undefined')
        return null

      try {
        return JSON.parse(item)
      }
      catch {
        return item
      }
    },
    remove: (key: string) => sessionStorage.removeItem(key),
  }
}
