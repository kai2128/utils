import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/userscript'
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
})
