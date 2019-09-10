import consola from 'consola'
import inquirer from 'inquirer'
import Blueprint from '../../blueprint'
import { exists } from '../../utils'
import { ejectTheme, ejectTemplates } from './eject'

export default class Commands {
  static async eject (args, nuxt, options) {
    const {
      dir,
      autodiscover: autodiscoverOptions,
      blueprints,
      normalizeInput = str => str.includes('/') || str.endsWith('s') ? str : `${str}s`
    } = options
    let templates = options.templates

    let discoveryPath = dir
    let typeKey = args[0]
    let blueprint

    if (blueprints) {
      [blueprint, typeKey] = args[0].split('/')

      discoveryPath = blueprints[blueprint]

      if (!discoveryPath) {
        consola.fatal(`Unrecognized blueprint '${blueprint}'`)
        return
      }
    }

    if (!await exists(discoveryPath)) {
      consola.fatal(`Blueprint path '${discoveryPath}' does not exists`)
      return
    }

    if (!templates) {
      templates = await Blueprint.autodiscover(discoveryPath, autodiscoverOptions)

      if (!templates) {
        consola.fatal(`Unrecognized blueprint path, autodiscovery failed for '${discoveryPath}'`)
        return
      }
    }

    // normalize key
    if (typeof normalizeInput === 'function') {
      typeKey = normalizeInput(typeKey)
    }

    if (typeKey === 'theme') {
      await ejectTheme(blueprint, discoveryPath)
      return
    }

    const templatesToEject = []

    if (templates[typeKey]) {
      templatesToEject.push(...[].concat(templates[typeKey]))
    }

    if (!templatesToEject.length) {
      for (const type in templates) {
        const templateToEject = templates[type].find(t => t.dst === typeKey)
        if (templateToEject) {
          templatesToEject.push(templateToEject)
          break
        }
      }
    }

    if (!templatesToEject.length) {
      // show a prompt so user can select for a list
      const choices = []
      for (const type in templates) {
        const templateChoices = templates[type].map((t, i) => ({
          name: t.dst,
          value: [type, i]
        }))

        choices.push(...templateChoices)
      }

      const answers = await inquirer.prompt([{
        type: 'checkbox',
        name: 'templates',
        message: 'Unrecognized template key, please select the files you wish to eject:\n',
        choices,
        pageSize: 15
      }])

      if (!answers.templates.length) {
        consola.fatal(`Unrecognized template key '${typeKey}'`)
        return
      }

      for (const [type, index] of answers.templates) {
        templatesToEject.push(templates[type][index])
      }
    }

    await ejectTemplates(nuxt, options, templatesToEject)
  }
}
