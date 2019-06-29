import Markdown from '@nuxt/markdown'

import {
  _import,
  resolve,
  exists,
  readdirSync,
  updateConfig,
  isSingleMode,
  routePath
} from '../../utils'

import { templates } from './constants'
import data from './data'

export default {
  data,
  templates,
  enabled(options) {
    if (isSingleMode.call(this, ['blog', 'slides'])) {
      options.prefix = '/'
    }
    // Enable docs blueprint if srcDir/*.md files exists
    // or if the srcDir/docs/ folder exists
    if (readdirSync(this.options.srcDir).find(p => /\.md$/.test(p))) {
      options.dir = './'
      return true
    }
    return exists(this.options.srcDir, options.dir)
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
      this.options.css.push(resolve('blueprints/docs/theme.css'))
    },
    async compile({ rootId }) {
      await updateConfig.call(this, rootId, { docs: this.$press.docs })
    },
    done({ options }) {
      this.options.watch.push('~/**/*.md')
      this.options.watch.push(`~/${options.docs.dir}/**/` + `*.md`)
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
        const md = new Markdown(source, { sanitize: false })
        return md.getTocAndMarkup()
      },
      title(fileName, body, toc) {
        if (toc && toc[0]) {
          return toc[0][1]
        }
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
