import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

import {
  importModule,
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
  enabled (options) {
    if (options.$standalone === 'docs') {
      options.docs.dir = ''
      options.docs.prefix = '/'
      return true
    }
    return exists(this.options.srcDir, options.docs.dir)
  },
  async generateRoutes (data, prefix, staticRoot) {
    let index = 'índex'
    if (this.$press.i18n) {
      index = this.$press.i18n.locales[0].code
    }
    return [
      {
        route: prefix(''),
        payload: await importModule(`${staticRoot}/sources${this.$press.docs.prefix}/${index}.json`)
      },
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await importModule(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  build: {
    before () {
      this.$addPressTheme('blueprints/docs/theme.css')
    },
    async compile ({ rootId }) {
      await updateConfig.call(this, rootId, { docs: this.$press.docs })
    },
    done ({ rootId }) {
      if (this.$isGenerate) {
        return
      }
      const watchDir = this.$press.docs.dir
        ? `${this.$press.docs.dir}/`
        : this.$press.docs.dir

      const updateDocs = async (path) => {
        const docsData = await data.call(this, { options: this.$press })
        if (docsData.options) {
          Object.assign(this.$press.docs, docsData.options)
        }
        await updateConfig.call(this, rootId, { docs: docsData.options })
        const source = Object.values(docsData.sources).find(s => s.src === path) || {}
        this.$pressSourceEvent('reload', 'docs', { data: docsData, source })
      }

      chokidar.watch([
        `${watchDir}*.md`,
        `${watchDir}**/*.md`
      ], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
        .on('change', updateDocs)
        .on('add', updateDocs)
        .on('unlink', updateDocs)
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
