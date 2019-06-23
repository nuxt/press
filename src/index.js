
import { registerBlueprints } from './blueprint'
import { resolve } from './utils'

export default async function (options) {
  // Load and register blueprints from './blueprints'
  await registerBlueprints('press', options, ['docs', 'blog', 'slides', 'press'])

  // Use the full Vue build for client-side template compilation
  this.extendBuild((config) => {
    config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
  })

  // Enable all of https://preset-env.cssdb.org/features
  this.options.build.postcss.preset.stage = 0

  // Automatically register modules
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  this.options.css.push(
    'prismjs/themes/prism.css',
    resolve('themes/default.css')
  )

  this.options.watch.push(
    '~/*.md',
    '~/docs/*.md',
    '~/blog/*.md',
    '~/blog/**/*.md',
    '~/slides/*.md'
  )
}
