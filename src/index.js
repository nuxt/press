
import { registerBlueprints } from './blueprint'
import { join, exists } from './utils'
import resolve from './resolve'

/**
 * @nuxt/press module for NuxtJS
 */
export default async function NuxtPressModule (options) {
  const nuxt = this.nuxt
  options = nuxt.options.press || options

  // Use the full Vue build for client-side template compilation
  this.extendBuild((config) => {
    config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
    config.resolve.alias.press = join(this.options.buildDir, 'press')
  })

  // Enable all of https://preset-env.cssdb.org/features
  nuxt.options.build.postcss.preset.stage = 0

  // Automatically register module dependencies
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  // Register stylesheets
  nuxt.options.css.push('prismjs/themes/prism.css')

  if (!exists(nuxt.options.srcDir, 'nuxt.press.css')) {
    nuxt.options.css.push(resolve('blueprints/common/theme.css'))
  } else {
    nuxt.options.css.push('~/nuxt.press.css')
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
