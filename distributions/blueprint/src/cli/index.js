import consola from 'consola'
import Commands from './commands'
import { options } from '@nuxt/cli-edge'

const { common } = options

export default {
  name: 'bp',
  description: 'CLI for Blueprints',
  usage: 'bp <blueprint-name> <cmd>',
  options: {
    ...common
  },
  async run (cmd) {

    const config = await cmd.getNuxtConfig()
console.log('CONFIG', config)
    const [blueprintName = '', command = '', ...args] = cmd.argv._
console.log(cmd.argv)
    if (!blueprintName || !config.modules.includes(blueprintName)) {
      consola.fatal(`Blueprint '${blueprintName}' not registered in Nuxt.js config -- please see docs`)
    }

    if (!command || !Commands[command]) {
      consola.fatal(`Unrecognized command '${command}' -- please see docs`)
    }

    return Commands[command](blueprintName, args)
  }
}
