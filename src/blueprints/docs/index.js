import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

import {
  _import,
  resolve,
  exists,
  updateConfig,
  routePath
} from '../../utils'

import { templates } from './constants'
import data from './data'

let mdProcessor

export default {
  data,
  templates,
  enabled(options) {
    if (options.$standalone === 'docs') {
      options.docs.dir = ''
      options.docs.prefix = '/'
      return true
    }
    return exists(this.options.srcDir, options.docs.dir)
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
        payload: await _import(`${staticRoot}/sources${this.$press.docs.prefix}/index.json`)
      },
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await _import(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  build: {
    before() {
      if (!exists(this.options.srcDir, 'nuxt.press.css')) {
        this.options.css.push(resolve('blueprints/docs/theme.css'))
      }
    },
    async compile({ rootId }) {
      await updateConfig.call(this, rootId, { docs: this.$press.docs })
    },
    done({ options }) {
      this.options.watch.push(`~/*.md`)
      this.options.watch.push(`~/${options.docs.dir}/**/*.md`)
    }
  },
  options: {
    dir: 'docs',
    prefix: '/docs/',
    title: 'My Documentation',
    nav: [],

    // If in Nuxt's SPA mode, setting custom API
    // handlers also disables bundling of index.json
    // and source/*.json files into the static/ folder
    // api({ rootId }) {
    //   const cache = {}
    //   const rootDir = join(this.options.buildDir, rootId, 'static')
    //   return {
    //     index: (req, res, next) => {
    //       if (this.options.dev || !cache.index) {
    //         cache.index = readJsonSync(rootDir, 'sources', 'docs', 'index.json')
    //       }
    //       res.json(cache.index)
    //     }
    //   }
    // },
    source: {
      markdown(source) {
        if (!mdProcessor) {
          const config = {
            toc: true,
            sanitize: false
          }

          mdProcessor = new Markdown(config).createProcessor()
          mdProcessor.use(customContainer)
        }

        return mdProcessor.toMarkup(source)
      },
      title(fileName, body, toc) {
        if (toc && toc[0]) {
          return toc[0][1]
        }

        const [, title] = body.substr(body.indexOf('#')).match(/^#+\s+(.*)/)

        if (title) {
          return title
        }

        return 'tesTTest'
      }
    }
  }
}
