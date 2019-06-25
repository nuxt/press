import consola from 'consola'

export default {
  name: 'press',
  description: 'CLI for @nuxt/press',
  usage: 'press <cmd>',
  run(cmd) {
    consola.info('argv', cmd.argv._)
    // const cstr = cmd.argv._[0]
  }
}
