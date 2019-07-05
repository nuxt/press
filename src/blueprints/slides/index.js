import Markdown from '@nuxt/markdown'
import { _import, resolve, exists, join, readJsonSync, isSingleMode } from '../../utils'
import data from './data'

let mdProcessor

export default {
  // Include data loader
  data,
  // Enable slides blueprint if srcDir/slides/*.md files exist
  enabled(options) {
    const modeCheck = isSingleMode.call(this, ['docs', 'blog', 'posts', 'entries'])
    if (options.$standalone === 'slides' || modeCheck.single) {
      options.prefix = '/'
      options.dir = ''
      return true
    }
    return exists(join(this.options.srcDir, options.dir))
  },
  templates: {
    plugin: ['plugin.js', { ssr: false }],
    layout: 'layout.vue',
    index: 'pages/index.vue',
    slides: 'components/slides.vue'
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
  generateRoutes(data, prefix, staticRoot) {
    return Object.keys(data.sources).map(async route => ({
      route: prefix(route),
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
      if (!exists(this.options.srcDir, 'nuxt.press.css')) {
        this.options.css.push(resolve('blueprints/slides/theme.css'))
      }
    },
    done({ options }) {
      this.options.watch.push(`~/${options.slides.dir}/*.md`)
    }
  },
  // Options are merged into the parent module default options
  options: {
    dir: 'slides',
    prefix: '/slides/',
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
        if (!mdProcessor) {
          mdProcessor = new Markdown({ sanitize: false }).createProcessor()
        }

        const { contents } = await mdProcessor.toHTML(source)
        return contents
      },
      // path() determines the final URL path of a Markdown source
      // In 'slides' mode, the default format is <prefix>/slides/<slug>
      path(fileName) {
        return `${this.$press.slides.prefix}${fileName.toLowerCase()}`
      }
    }
  }
}
