import consola from 'consola'
import Commands from './commands'
import { options } from '@nuxt/cli-edge'

const { common } = options

export default async function run(cmd, options) {
  const [command = '', ...args] = cmd.argv._

  if (!command || !Commands[command]) {
    consola.fatal(`Unrecognized command '${command}'`)
  }

  return Commands[command](args, options)
}
