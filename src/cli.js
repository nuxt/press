import consola from 'consola'

export default {
  name: 'press',
  description: 'CLI for @nuxt/press',
  usage: 'press <cmd>',
  run(cmd) {
    consola.info(cmd.argv)
  }
}
