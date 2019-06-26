import consola from 'consola'

import docs from './blueprints/docs'
import blog from './blueprints/blog'
import slides from './blueprints/slides'
import common from './blueprints/common'

const blueprints = { docs, blog, slides, common }

class commands {
  static eject(...args) {
    const [ blueprint, template ] = args[0].split('/')
    if (blueprint in blueprints) {
      if (template) {
        const templatePath = join(blueprint, blueprints[blueprint].templates[template])
      } else {
        for (let bTemplate of Object.values(blueprints[blueprint].templates)) {

        }
      }
    }
  }
}

export default {
  name: 'press',
  description: 'CLI for @nuxt/press',
  usage: 'press <cmd>',
  run(cmd) {
    if (cmd.argv._.length && cmd.argv._[0] in commands) {
      commands[cmd.argv._[0]](cmd.argv._.slice(1))
    } else {
      console.log('Unrecognized command -- please see docs at https://nuxt.press/')
    }
  }
}
