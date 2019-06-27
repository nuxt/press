import Markdown from '@nuxt/markdown'

import {
  _import,
  resolve,
  exists,
  join,
  readdirSync,
  readJsonSync,
  slugify,
  updateJson,
  isSingleMode
} from '../../utils'

import data from './data'

export default {
  // Include data loader
  data,
  enabled(options) {
    if (isSingleMode.call(this, ['blog', 'slides'])) {
      options.prefix = '/'
    }

    // Enable docs blueprint if srcDir/*.md files exists
    // or if the srcDir/docs/ folder exists
    if (readdirSync(this.options.srcDir).find(p => /\.md$/.test(p))) {
      return true
    }
    return exists(this.options.srcDir, options.dir)
  },
  templates: {
    'plugin': 'plugin.js',
    'layout': 'layout.vue',
    'toc': 'components/toc.vue',
    'header': 'components/header.vue',
    'index': 'pages/index.vue',
    'topic': 'pages/topic.vue'
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
  async generateRoutes(data, prefix, staticRoot) {
    return [
      {
        route: prefix('index'),
        payload: await _import(`${staticRoot}/sources${this.options.docs.prefix}topics/index.json`)
      },
      ...Object.keys(data.sources).map(async route => ({
        route,
        payload: await _import(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  serverMiddleware({ options, rootId, id }) {
    const { index } = options.docs.api.call(this, { rootId, id })
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
  build: {
    before() {
      this.options.css.push(resolve('blueprints/docs/theme.css'))
    },
    async compile({ data }) {
      updateJson(
        join(this.options.srcDir, 'nuxt.press.json'),
        {
          docs: {
            ...this.$press.docs.meta,
            toc: Object.keys(data.topLevel.index)
          }
        }
      )
    },
    done({ options }) {
      this.options.watch.push('~/*.md')
      this.options.watch.push(`~/${options.docs.dir}/*.md`)
    }
  },
  options: {
    dir: 'docs',
    prefix: '/docs/',
    meta: {
      title: "Demo",
      top: {
        external: [],
        links: []
      }
    },
    api({ rootId, id }) {
      const cache = {}
      const rootDir = join(this.options.buildDir, rootId, 'static')
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'docs', 'index.json')
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
          return 'topics/index'
        }

        return `topics/${slugify(title)}`
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
