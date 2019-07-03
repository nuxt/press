const { existsSync, readFileSync, writeFileSync } = require('fs')
const { join, resolve } = require('path')

if (!process.env.INIT_CWD) {
  return
}

const initCwd = resolve(process.env.INIT_CWD)

if (!existsSync(join(initCwd, 'node_modules'))) {
  return
}

// Detect common presence of docs/nuxt.config.js
if (existsSync(join(initCwd, 'docs', 'nuxt.config.js'))) {
  return
}

const scripts = {
  'dev': 'nuxt dev',
  'build': 'nuxt build',
  'start': 'nuxt start',
  'press': 'nuxt press'
}

function updatePackageJson() {
  if (!existsSync(join(initCwd, 'package.json'))) {
    writeFileSync(
      join(initCwd, 'package.json'),
      JSON.stringify({ scripts }, null, 2)
    )
    return
  }
  let packageJson
  try {
    packageJson = JSON.parse(
      readFileSync(join(initCwd, 'package.json')).toString()
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
      join(initCwd, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }
}

function writeNuxtConfig() {
  const nuxtConfig = join(initCwd, 'nuxt.config.js')
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
