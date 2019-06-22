import Markdown from '@nuxt/markdown'
import { exists, readdirSync, readJsonSync, slugify } from '../../utils'

export default {
  // Enable docs blueprint if srcDir/*.md files exists
  // or if the srcDir/docs/ folder exists
  enabled() {
    return (
      readdirSync(this.options.srcDir).find(p => /\.md$/.test(p)) ||
      exists(this.options.srcDir, this.$press.docs.dir)
    )
  },
  templates: {
    plugin: 'plugin.js'
    layout: 'layout.vue',
    toc: 'components/toc.vue',
    index: 'pages/index.vue',
    topic: 'pages/topic.vue'
  },
  routes(templates) {
    return [
      {
        name: 'docs_index',
        path: this.$press.docs.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes(data, prefix, staticRoot) {
    return [
      {
        route: prefix('index'),
        payload: require(`${staticRoot}/sources/index.json`)
      },
      ...Object.keys(data.sources).map((route) => ({
        route,
        payload: require(`${staticRoot}/sources${source}`)          
      })
    ]
  },
  serverMiddleware() {
    const { index } = this.$press.docs.api.call(this)
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/docs/index')) {
          index(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  defaults: {
    dir: 'docs',
    prefix: '/docs',
    meta: {
      title: 'Documentation suite',
      github: 'https://github.com/...'
    },
    api() {
      const cache = {}
      const rootDir = this.options.buildDir
      return {
        index(req, res, next) {
          if (dev || !cache.index) {
            cache.index = readStaticJson(rootDir, 'docs', 'index.json')
          }
          res.json(cache.index)
        }
      }
    },
    source: {
      markdown(source) {
        const md = new Markdown(source, {
          sanitize: false
        })
        return md.getTocAndMarkup()
      },
      path(fileName, { title, published }) {
        if (['index', 'README'].includes(fileName)) {
          return '/topics/index'
        }
        const slug = title.replace(/\s+/g, '-')
        return `/topics/${slugify(slug)}`
      },
      title(fileName, body) {
        if (['index', 'README'].includes(fileName)) {
          return 'Intro'
        }
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
