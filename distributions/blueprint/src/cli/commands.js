import consola from 'consola'
import { ejectTheme, ejectTemplate } from './eject'

// TODO: fill blueprint templates from running autodiscover
const blueprints = {}

export default class Commands {
  static async eject (args) {
    const [blueprint, key] = args[0].split('/')

    if (!(blueprint in blueprints)) {
      consola.fatal('Unrecognized template bundle -- see docs at https://nuxt.press/')
      return
    }

    if (key === 'theme') {
      await ejectTheme(blueprint)
      return
    }

    if (key) {
      if (!blueprints[blueprint].templates[key]) {
        consola.fatal('Unrecognized template key -- see docs at https://nuxt.press/')
        return
      }

      let template = blueprints[blueprint].templates[key]
      if (Array.isArray(template)) {
        template = template[0]
      }
      await ejectTemplate(blueprint, template)
      return
    }

    for (let template of Object.values(blueprints[blueprint].templates)) {
      if (Array.isArray(template)) {
        template = template[0]
      }
      await ejectTemplate(blueprint, template)
    }
  }
}
