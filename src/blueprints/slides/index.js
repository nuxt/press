import Markdown from '@nuxt/markdown'
import { _import, resolve, exists, join, readJsonSync } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  // Enable slides blueprint if srcDir/slides/*.md files exist
  enabled(options) {
    return exists(join(this.options.srcDir, options.dir))
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
    return Object.keys(data.sources).map(async route => ({
      route,
      payload: await _import(`${staticRoot}/sources${route}`)
    }))
  },
  // Register serverMiddleware
  serverMiddleware({ options, rootId, id }) {
    const { index } = options.slides.api.call(this, { rootId, id })
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/slides/index')) {
          index(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    before() {
      this.options.css.push(resolve('blueprints/slides/theme.css'))
    },
    done({ options }) {
      this.options.watch.push(`~/${options.slides.dir}*.md`)
    }
  },
  // Options are merged into the parent module default options
  options: {
    dir: 'slides',
    prefix: '/slides',
    api({ rootId }) {
      const cache = {}
      const rootDir = join(this.options.buildDir, rootId, 'static')
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'slides', 'index.json')
          }
          res.json(cache.index)
        }
      }
    },
    source: {
      async markdown(source) {
        const md = new Markdown(source, { sanitize: false })
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
