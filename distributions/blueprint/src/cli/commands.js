import consola from 'consola'
import { ejectTheme, ejectTemplate } from './eject'
import Blueprint from '../blueprint'
import { exists } from '../utils'

// TODO: fill blueprint templates from running autodiscover
const blueprints = {}

export default class Commands {
  static async eject (args, options) {
    const {
      name,
      dir,
      bundles,
      normalizeKey = str => str.endsWith('s') ? str : `${str}s`
    } = options
    let templates = options.templates

    let discoveryPath = dir
    let key = args[0]
    let bundleName

    if (bundles) {
      [bundleName, key] = args[0].split('/')

      discoveryPath = bundles[bundleName]

      if (!discoveryPath) {
        consola.fatal(`Unrecognized template bundle '${bundleName}'`)
        return
      }
    }

    if (!await exists(discoveryPath)) {
      consola.fatal(`Blueprint path '${discoveryPath}' does not exists`)
      return
    }

    if (!templates) {
      templates = await Blueprint.autodiscover(discoveryPath)

      if (!templates) {
        consola.fatal(`Unrecognized blueprint path, autodiscovery failed for '${discoveryPath}'`)
        return
      }
    }

    // normalize key
    if (typeof normalizeKey === 'function') {
      key = normalizeKey(key)
    }

    if (key === 'theme') {
      await ejectTheme(bundleName)
      return
    }

    if (key) {
      if (!templates[key]) {
        consola.fatal('Unrecognized template key')
        return
      }

      let template = templates[key]
      if (Array.isArray(template)) {
        [template] = template
      }

      await ejectTemplate(bundleName, template)
      return
    }

    for (let template of Object.values(templates)) {
      if (Array.isArray(template)) {
        [template] = template
      }

      await ejectTemplate(bundleName, template)
    }
  }
}
