import consola from 'consola'
import Commands from './commands'

export default {
  name: 'press',
  description: 'CLI for NuxtPress',
  usage: 'press <cmd>',
  run (cmd) {
    if (cmd.argv._.length && cmd.argv._[0] in Commands) {
      return Commands[cmd.argv._[0]](cmd.argv._.slice(1))
    }

    consola.fatal('Unrecognized command -- please see docs at https://nuxt.press/')
  }
}
