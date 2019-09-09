import consola from 'consola'
import { NuxtCommand } from '@nuxt/cli-edge'
import run from './run'

export default async function runBlueprint(options = {}) {
  const {
    name = 'blueprint',
    description
  } = options

  await NuxtCommand.run({
    name,
    description: description || `CLI for ${name}`,
    usage: `${name} <blueprint-name> <cmd>`,
    run (cmd) {
      return run(cmd, options)
    }
  })
}

