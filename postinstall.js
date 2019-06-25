const { existsSync, readFileSync, writeFileSync } = require('fs')
const { join, resolve } = require('path')
const packageRoot = resolve(join(process.cwd(), '..', '..', '..'))

const scripts = {
  'dev': 'nuxt dev',
  'build': 'nuxt build',
  'start': 'nuxt start',
  'press': 'nuxt press'
}

function updatePackageJson() {
  if (!existsSync(join(packageRoot, 'package.json'))) {
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ scripts }, null, 2)
    )
    return
  }
  let packageJson
  try {
    packageJson = JSON.parse(
      readFileSync(join(packageRoot, 'package.json')).toString()
    )
  } catch(_) {
    packageJson = {}
  }
  if (!packageJson.scripts) {
    packageJson.scripts = {}
    for (const script in scripts) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = scripts[script]
      }
    }
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }
}

function writeNuxtConfig() {
  const nuxtConfig = join(packageRoot, 'nuxt.config.js')
  if (!existsSync(nuxtConfig)) {
    writeFileSync(
      nuxtConfig,
      'export default {\n' +
      '  modules: [\'@nuxt/press\']\n' +
      '}\n'
    )
  }
}

updatePackageJson()
writeNuxtConfig()
