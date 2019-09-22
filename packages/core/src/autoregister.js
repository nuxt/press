import consola from 'consola'
import { normalizeConfig, importModule } from '@nuxt-press/utils'
import PressBlueprint from './blueprint'

const allModes = ['docs', 'blog', 'slides', 'pages']

export default async function autoregister (options, modes) {
  // Note:`this` refers to the ModuleContainer instance
  const config = await PressBlueprint.loadRootConfig({
    rootDir: this.nuxt.options.rootDir,
    options: this.nuxt.options,
    config: normalizeConfig(options)
  })

  if (Array.isArray(modes)) {
    modes = modes.filter(mode => allModes.includes(mode))
  } else {
    modes = allModes
  }

  let pressInstances = {}
  for (const mode of modes) {
    try {
      const { Blueprint } = await importModule(`@nuxt-press/${mode}`)

      const modeInstances = await Blueprint.register(this, config)
      if (modeInstances) {
        pressInstances = {
          ...pressInstances,
          ...modeInstances
        }
      }
    } catch (error) {
      // TODO: improve message
      if (error.code === 'MODULE_NOT_FOUND') {
        consola.warn(`Please install @nuxt-press/${mode}`, error)
      } else {
        consola.error(error)
      }
    }
  }

  // first run all setups
  const setupPromises = Object.values(pressInstances).map(modeInstance => modeInstance.setup())
  await Promise.all(setupPromises)

  // then init the mode instances
  const initPromises = Object.values(pressInstances).map(modeInstance => modeInstance.init())
  await Promise.all(initPromises)

  return pressInstances
}
