
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
  this.options.css.push('prismjs/themes/prism.css')

  if (!exists(this.options.srcDir, 'nuxt.press.css')) {
    this.options.css.push(resolve('blueprints/common/default.css'))
  } else {
    this.options.css.push('~/nuxt.press.css')
  }

  // Common helper for writing JSON responses
  this.addServerMiddleware((_, res, next) => {
    res.json = (data) => {
      res.type = 'application/json'
      res.write(JSON.stringify(data))
      res.end()
    }
    next()
  })

  // Load and register blueprints from './blueprints'
  await registerBlueprints.call(this, 'press', options, ['docs', 'blog', 'slides', 'common'])
}
