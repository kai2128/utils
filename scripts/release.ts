import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'

import consola from 'consola'
import { $ } from 'zx'
import { getPkgRoot, publishPackage } from './utils'

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
export const __dirname = path.dirname(__filename) // get the name of the directory

/**
 * get monorepo packages
 */
const packages = fs
  .readdirSync(path.resolve(__dirname, '../packages'))
  .filter(
    p => !p.endsWith('.ts') && !p.endsWith('.md') && !p.startsWith('.'),
  )
console.log(packages)

async function main() {
  // upgrade by bumpp
  const { version } = await fs.readJSON('package.json')

  // update all package versions and inter-dependencies

  consola.debug('Updating cross dependencies...')
  updateVersions(version)

  // build packages
  consola.debug('Building all packages...')
  await $`npm run build`

  // publish package
  console.log()
  consola.debug('Publishing packages...')
  for (const pkg of packages)
    await publishPackage(pkg, targetVersion)
}

function updateVersions(version: string) {
  // 1. update root package.json
  updatePackage(path.resolve(__dirname, '..'), version)
  // 2. update all packages
  packages.forEach(p => updatePackage(getPkgRoot(p), version))
}

function updatePackage(pkgRoot: string, version: string) {
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  updateDeps(pkg, 'dependencies', version)
  updateDeps(pkg, 'peerDependencies', version)
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

function updateDeps(pkg: any, depType: string, version: string) {
  const deps = pkg[depType]
  if (!deps)
    return
  const pkgName = 'kai2128'
  Object.keys(deps).forEach((dep) => {
    if (
      dep === pkgName
      || (dep.startsWith(`@${pkgName}`)
      && packages.includes(dep.replace(`@${pkgName}`, '')))
    ) {
      consola.warn(`${pkg.name} -> ${depType} -> ${dep}@${version}`)
      deps[dep] = version
    }
  })
}

main().catch((err) => {
  console.error(err)
})
