
import { registerBlueprints } from './blueprint'
import { resolve } from './utils'

export default async function (options) {
  // Use the full Vue build for client-side template compilation
  this.extendBuild((config) => {
    config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
  })

  // Enable all of https://preset-env.cssdb.org/features
  this.options.build.postcss.preset.stage = 0

  // Automatically register module dependencies
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  // Register stylesheets
  this.options.css.push(
    'prismjs/themes/prism.css',
    resolve('themes/default.css')
  )

  // Load and register blueprints from './blueprints'
  await registerBlueprints.call(this, 'press', options, ['docs', 'blog', 'slides', 'common'])

  // Register Markdown watchers
  this.options.watch.push(
    '~/*.md',
    `~/${this.$press.docs.dir}*.md`,
    `~/${this.$press.blog.dir}*.md`,
    `~/${this.$press.blog.dir}**/*.md`,
    `~/${this.$press.slides.dir}*.md`
  )
}
