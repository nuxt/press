import Markdown from '@nuxt/markdown'

import {
  _import,
  resolve,
  exists,
  join,
  readdirSync,
  updateJson,
  isSingleMode,
  routePath
} from '../../utils'

import { templates } from './constants'
import data from './data'

export default {
  // Include data loader
  data: async (nuxt, ...args) => {
    const { sidebars, sources } = await data.call(nuxt, ...args)
    this.sidebars = sidebars
    return { sources }
  },
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
  templates,
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
    compile({ rootId, id }) {
      updateJson(
        join(this.options.srcDir, 'nuxt.press.json'),
        {
          [id]: { ...this.$press.docs.meta }
        }
      )
    },
    done({ options }) {
      this.options.watch.push('~/**/*.md')
      this.options.watch.push(`~/${options.docs.dir}/**/` + `*.md`)
    }
  },
  options: {
    dir: 'docs',
    prefix: '/docs/',
    meta: {
      title: 'My Documentation',
      nav: []
    },
    source: {
      sidebars: () => {
        return this.sidebars
      },

      markdown(source) {
        const md = new Markdown(source, {
          sanitize: false
        })
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
