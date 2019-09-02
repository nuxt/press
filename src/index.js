import { registerBlueprints } from './blueprint'
import { resolve, join, exists } from './utils'
import SSE from './sse'

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
  if (!options.naked) {
    // TODO Add addStylesheet() to Module Container API
    // To prevent adding duplicated entries automatically
    nuxt.options.css.push(
      'normalize.css/normalize.css',
      'wysiwyg.css/wysiwyg.css',
      resolve('blueprints/common/prism.css')
    )
  }

  if (exists(nuxt.options.srcDir, 'nuxt.press.css')) {
    nuxt.options.css.push('~/nuxt.press.css')
  }

  if (nuxt.options.dev) {
    // Hot reload for Markdown files
    const ssePool = new SSE()

    this.$pressSourceEvent = async (event, app, payload) => {
      if (event === 'reload') {
        await this.saveDevDataSources(app, payload.data)
        ssePool.broadcast('change', payload.source)
      } else {
        await this.saveDevDataSources(app, { sources: { source: payload } })
        ssePool.broadcast(event, payload)
      }
    }

    this.addServerMiddleware({
      path: '/__press/hot',
      handler: (req, res) => ssePool.subscribe(req, res)
    })
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
  await registerBlueprints.call(this, 'press', options)
}
