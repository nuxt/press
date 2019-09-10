import { NuxtCommand, options } from '@nuxt/cli-edge'
import run from './run'

const { common } = options

export default async function runBlueprint (options = {}) {
  const {
    name = 'blueprint',
    description
  } = options

  await NuxtCommand.run({
    name,
    description: description || `CLI for ${name}`,
    usage: `${name} <blueprint-name> <cmd>`,
    options: {
      ...common
    },
    async run (cmd) {
      // remove argv's so nuxt doesnt pick them up as rootDir
      const argv = cmd.argv._.splice(0, cmd.argv._.length)

      const config = await cmd.getNuxtConfig()
      const nuxt = await cmd.getNuxt(config)

      return run(argv, nuxt, options)
    }
  })
}
