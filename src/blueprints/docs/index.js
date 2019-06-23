import Markdown from '@nuxt/markdown'
import { exists, join, readdirSync, readJsonSync, slugify, writeJson } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  // Enable docs blueprint if srcDir/*.md files exists
  // or if the srcDir/docs/ folder exists
  enabled(config) {
    console.log('config', config)
    return (
      readdirSync(this.options.srcDir).find(p => /\.md$/.test(p)) ||
      exists(this.options.srcDir, config.docs.dir)
    )
  },
  templates: {
    'plugin': 'plugin.js',
    'scroll/plugin': 'plugin.js',
    'layout': 'layout.vue',
    'toc': 'components/toc.vue',
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
  generateRoutes(data, prefix, staticRoot) {
    return [
      {
        route: prefix('index'),
        payload: require(`${staticRoot}/sources/index.json`)
      },
      ...Object.keys(data.sources).map(route => ({
        route,
        payload: require(`${staticRoot}/sources${route}`)
      }))
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
  hooks: {
    async compileBuild({ data }) {
      const pressJson = {
        toc: Object.keys(data.topLevel.index)
      }
      const pressJsonPath = join(this.options.srcDir, 'nuxt.press.json')
      if (!exists(pressJsonPath)) {
        await writeJson(pressJsonPath, pressJson, { spaces: 2 })
      }
    }
  },
  options: {
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
