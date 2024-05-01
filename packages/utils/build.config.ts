import { renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    output: {
      name: 'utils',
      format: 'iife',
    },
  },
  hooks: {
    'build:done': function ({ options }) {
      renameSync(resolve(options.outDir, 'index.mjs'), resolve(options.outDir, 'index.js'))
    },
  },
})
