import Markdown from '@nuxt/markdown'
import { slugify } from '../utils'

export default {
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
  serverMiddleware() {
    let indexHandler
    const configAPI = this.$press.docs.api
    if (configAPI.index) {
      indexHandler = configAPI.index
    } else {
      indexHandler = api.docs(this.options.buildDir).index
    }
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/docs/index')) {
          indexHandler(req, res, next)
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
