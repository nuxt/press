import defu from 'defu'
import { importModule } from './module'
import { exists, join, readJson, writeJson, ensureDir } from './fs'

export const isPureObject = value => typeof value === 'object' && value !== null && !Array.isArray(value)

function removePrivateKeys (source, target = {}) {
  target = target || {}

  for (const prop in source) {
    if (prop === '__proto__' || prop === 'constructor') {
      continue
    }

    // props starting with a $ are private
    if (prop.startsWith('$')) {
      continue
    }

    // we dont want to save source or api
    if (prop === 'source' || prop === 'api') {
      continue
    }

    const value = source[prop]
    // recursively check value if its an object
    if (isPureObject(value)) {
      target[prop] = {}

      removePrivateKeys(value, target[prop])
      continue
    }

    target[prop] = value
  }
  return target
}

export async function loadConfig (rootId, config = {}) {
  // Detect standalone mode
  if (typeof config === 'string') {
    config = { $standalone: config }
  }

  const fileExtensions = ['js', 'json']
  for (const fileExtension of fileExtensions) {
    const jsConfigPath = join(this.options.rootDir, `nuxt.${rootId}.${fileExtension}`)

    // JavaScript config has precedence over JSON config
    if (exists(jsConfigPath)) {
      // load external config
      const externalConfig = await importModule(jsConfigPath)

      // apply defaults
      config = defu(externalConfig, config)
    }
  }

  const blueprintsConfig = defu(config, this.options[rootId] || {})
  this.options[rootId] = blueprintsConfig

  this[`$${rootId}`] = blueprintsConfig
  this[`$${rootId}`].$buildDir = this.options.buildDir

  return blueprintsConfig
}

export async function updateConfig ({ rootId, id, options }) {
  // Copy object and remove props that start with $
  // (These can be used for internal template pre-processing)
  const cleanedOptions = removePrivateKeys(options)

  // dont update when cleaned config is empty
  if (!Object.keys(cleanedOptions).length) {
    return
  }

  const config = { [id]: cleanedOptions }

  // ensure a rootId folder exists in buildDir
  const buildDirRoot = join(this.options.buildDir, rootId)
  await ensureDir(join(buildDirRoot))

  // If .js config found, do nothing
  // we only update JSON files, not JavaScript
  if (exists(join(this.options.rootDir, `nuxt.${rootId}.js`))) {
    const config = await importModule(join(this.options.rootDir, `nuxt.${rootId}.js`))

    await writeJson(join(buildDirRoot, 'config.json'), config, { spaces: 2 })
    return
  }

  const path = join(this.options.rootDir, `nuxt.${rootId}.json`)
  if (!exists(path)) {
    await writeJson(path, config, { spaces: 2 })
    return
  }

  try {
    const existingConfig = await readJson(path, { throws: true })

    const updated = defu(existingConfig || {}, config)

    await writeJson(path, updated, { spaces: 2 })
    await writeJson(join(buildDirRoot, 'config.json'), updated, { spaces: 2 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err)
  }
}
