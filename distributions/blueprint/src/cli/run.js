import consola from 'consola'
import Commands from './commands'

export default function run (argv, nuxt, options) {
  const [command = '', ...args] = argv

  if (!command || !Commands[command]) {
    consola.fatal(`Unrecognized command '${command}'`)
  }

  return Commands[command](args, nuxt, options)
}
