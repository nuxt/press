import path from 'path'
import { defaultsDeep } from 'lodash'
import NuxtPress from '../../src'

export { Nuxt } from '@nuxt/core'
export { Builder } from '@nuxt/builder'
export { Generator } from '@nuxt/generator'
export { BundleBuilder } from '@nuxt/webpack'
export * from '@nuxt/utils'

export async function loadFixture(fixture, overrides) {
  const rootDir = path.isAbsolute(fixture) ? fixture : path.resolve(__dirname, '..', 'fixtures', fixture)
  let config = {}

  try {
    config = await import(`${rootDir}/nuxt.config`)
    config = config.default || config
  } catch (e) {
    // Ignore MODULE_NOT_FOUND
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
  }

  if (typeof config === 'function') {
    config = await config()
  }

  config.rootDir = rootDir
  config.dev = false
  config.test = true

  config.modules = config.modules || []
  const moduleName = NuxtPress.name

  let hasNuxtPress = false
  if (config.modules) {
    hasNuxtPress = config.modules.some(m => {
      return (typeof m === 'function' && m.name === moduleName) || (Array.isArray(m) && m[0].name === moduleName)
    })
  }

  if (!hasNuxtPress) {
    config.modules.push(NuxtPress)
  }

  return defaultsDeep({}, overrides, config)
}
