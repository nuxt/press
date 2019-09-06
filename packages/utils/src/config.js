import path from 'path'
import defu from 'defu'
import { exists } from '@nuxt/blueprint'
import { importModule } from './module'
import { readJson, writeJson, ensureDir } from './fs'

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

export function normalizeConfig (config) {
  // TODO: improve this
  if (typeof config === 'string') {
    config = { mode: config }
  }

  return config
}

export async function loadConfig ({ rootId, rootDir, config }) {
  const fileExtensions = ['js', 'json']

  for (const fileExtension of fileExtensions) {
    const jsConfigPath = path.join(rootDir, `nuxt.${rootId}.${fileExtension}`)

    // JavaScript config has precedence over JSON config
    if (await exists(jsConfigPath)) {
      // load external config
      const externalConfig = await importModule(jsConfigPath)

      // apply defaults
      config = defu(externalConfig, config)
      config.configPath = jsConfigPath
      break
    }
  }

  return config
}

export async function saveConfig ({ rootId, id, options }) {
  // Copy object and remove props that start with $
  // (These can be used for internal template pre-processing)
  const cleanedOptions = removePrivateKeys(options)

  // dont update when cleaned config is empty
  if (!Object.keys(cleanedOptions).length) {
    return
  }

  const config = { [id]: cleanedOptions }

  // ensure a rootId folder exists in buildDir
  const buildDirRoot = path.join(this.options.buildDir, rootId)
  await ensureDir(buildDirRoot)

  // If .js config found, do nothing
  // we only update JSON files, not JavaScript
  if (await exists(path.join(this.options.rootDir, `nuxt.${rootId}.js`))) {
    const config = await importModule(path.join(this.options.rootDir, `nuxt.${rootId}.js`))

    await writeJson(path.join(buildDirRoot, 'config.json'), config, { spaces: 2 })
    return
  }

  const configPath = path.join(this.options.rootDir, `nuxt.${rootId}.json`)
  if (!await exists(configPath)) {
    await writeJson(configPath, config, { spaces: 2 })
    return
  }

  try {
    const existingConfig = await readJson(configPath, { throws: true })

    const updated = defu(existingConfig || {}, config)

    await writeJson(configPath, updated, { spaces: 2 })
    await writeJson(path.join(buildDirRoot, 'config.json'), updated, { spaces: 2 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err)
  }
}
