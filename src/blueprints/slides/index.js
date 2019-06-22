import Markdown from '@nuxt/markdown'
import { readJsonSync } from '../../utils'

export default {
  enabled(config) {
    return exists(join(this.options.srcDir, config.slides.dir))
  },
  templates: {
    plugin: ['plugin.js', { ssr: false }],
    layout: 'layout.vue',
    index: 'pages/index.vue',
    slides: 'pages/slides.vue'
  },
  // Register routes once templates have been added
  routes(templates) {
    return [
      {
        name: 'slides_index',
        path: this.$press.slides.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes(data, _, staticRoot) {
    return Object.keys(data.sources).map((route) => ({
      route,
      payload: require(`${staticRoot}/sources${source}`)          
    })
  },
  // Register serverMiddleware
  serverMiddleware() {
    let indexHandler
    const configAPI = this.$press.slides.api
    if (configAPI.index) {
      indexHandler = configAPI.index
    } else {
      indexHandler = api.slides(this.options.buildDir).index
    }
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/slides/index')) {
          indexHandler(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  // Options are merged into the parent module default options
  options: {
    slides: {
      dir: 'slides',
      prefix: '/slides',
      api() {
        const cache = {}
        const rootDir = this.options.buildDir
        return {
          index(req, res, next) {
            if (dev || !cache.index) {
              cache.index = readJsonSync(rootDir, 'slides', 'index.json')
            }
            res.json(cache.index)
          }
        }
      },
      source: {
        async markdown(source) {
          const md = new Markdown(source, {
            skipToc: true,
            sanitize: false
          })
          const html = await md.toHTML()
          return html.contents
        },
        // path() determines the final URL path of a Markdown source
        // In 'slides' mode, the default format is <prefix>/slides/<slug>
        path(fileName) {
          return `/slides/${fileName.toLowerCase()}`
        }
      }
    }
  }
}
