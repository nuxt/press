import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

import {
  importModule,
  exists,
  updateConfig,
  routePath
} from '../../utils'

import resolve from '../../resolve'

import { templates } from './constants'
import data from './data'

let mdProcessor

export default {
  data,
  templates,
  enabled (options) {
    if (options.$standalone === 'docs') {
      options.docs.dir = ''
      options.docs.prefix = '/'
      return true
    }
    return exists(this.options.srcDir, options.docs.dir)
  },
  routes (templates) {
    return [
      {
        name: 'docs_index',
        path: this.$press.docs.prefix,
        component: templates.index
      }
    ]
  },
  async generateRoutes (data, prefix, staticRoot) {
    return [
      {
        route: prefix(''),
        payload: await importModule(`${staticRoot}/sources${this.$press.docs.prefix}/index.json`)
      },
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await importModule(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  build: {
    before () {
      if (!this.options.watch.includes('~/*.md')) {
        this.options.watch.push(`~/*.md`)
      }
      if (!this.options.watch.includes('~/*/**.md')) {
        this.options.watch.push('~/*/**.md')
      }
      if (!this.options.$press.naked) {
        this.options.css.unshift(resolve('blueprints/docs/theme.css'))
      }
    },
    async compile ({ rootId }) {
      await updateConfig.call(this, rootId, { docs: this.$press.docs })
    }
  },
  options: {
    dir: 'docs',
    prefix: '/docs/',
    title: 'My Documentation',
    nav: [],
    source: {
      processor () {
        const config = { toc: true, sanitize: false }
        mdProcessor = new Markdown(config).createProcessor()
        mdProcessor.use(customContainer)
        return mdProcessor
      },
      markdown (source, processor) {
        return processor.toMarkup(source)
      },
      title (fileName, body, toc) {
        if (toc && toc[0]) {
          return toc[0][1]
        }

        const titleMatch = body.substr(body.indexOf('#')).match(/^#+\s+(.*)/)

        if (titleMatch) {
          return titleMatch[1]
        }

        return fileName
      }
    }
  }
}
