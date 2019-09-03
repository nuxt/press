import consola from 'consola'
import { normalizeConfig, importModule } from '@nuxtpress/utils'
import PressBlueprint from './blueprint'

const modes = ['docs', 'blog', 'slides', 'pages']

export default async function autoregister (options) {
  // Note:`this` refers to the ModuleContainer instance
  const config = await PressBlueprint.loadRootConfig({
    rootDir: this.nuxt.options.rootDir,
    options: this.nuxt.options,
    config: normalizeConfig(options)
  })

  let pressInstances = {}
  for (const mode of modes) {
    try {
      const { Blueprint } = await importModule(`@nuxtpress/${mode}`)

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
        consola.warn(`Please install @nuxtpress/${mode}`, error)
      } else {
        consola.error(error)
      }
    }
  }

  const initPromises = Object.values(pressInstances).map(modeInstance => modeInstance.init())
  await Promise.all(initPromises)

  return pressInstances
}
