import consola from 'consola'

import {
  ensureDir,
  join,
  dirname,
  writeFile,
  readFile
} from './utils'

import docs from './blueprints/docs'
import blog from './blueprints/blog'
import slides from './blueprints/slides'
import common from './blueprints/common'

const cwd = process.cwd()
const blueprints = { docs, blog, slides, common }

async function ejectTemplate(path) {
  const blueprintsPath = join(dirname(require.resolve(`@nuxt/press`)), 'blueprints')
  await ensureDir(join(cwd, 'press', dirname(path)))
  await writeFile(
    join(cwd, 'press', path),
    await readFile(join(blueprintsPath, path))
  )
  consola.info(`Ejected press/${path}`)
}

class commands {
  static async eject(args) {
    const [ blueprint, template ] = args[0].split('/')
    if (blueprint in blueprints) {
      if (template) {
        if (!blueprints[blueprint].templates[template]) {
          consola.fatal('Unrecognized template -- please see docs at https://nuxt.press/')
          process.exit()
        }
        await ejectTemplate(join(blueprint, blueprints[blueprint].templates[template]))
      } else {
        for (const bTemplate of Object.values(blueprints[blueprint].templates)) {
          if (typeof bTemplate !== 'string') {
            continue
          }
          await ejectTemplate(join(blueprint, bTemplate))
        }
      }
    }
  }
}

export default {
  name: 'press',
  description: 'CLI for NuxtPress',
  usage: 'press <cmd>',
  async run(cmd) {
    if (cmd.argv._.length && cmd.argv._[0] in commands) {
      await commands[cmd.argv._[0]](cmd.argv._.slice(1))
    } else {
      consola.fatal('Unrecognized command -- please see docs at https://nuxt.press/')
    }
  }
}
