import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

import {
  importModule,
  exists,
  updateConfig,
  routePath,
  markdownToText
} from '../../utils'

import { templates, defaultDir, defaultPrefix } from './constants'
import data from './data'

let mdProcessor

export default {
  data,
  templates,
  enabled (options) {
    if (options.$standalone === 'docs') {
      options.docs.dir = options.docs.dir || ''
      options.docs.prefix = options.docs.prefix || '/'
      return true
    }

    if (options.docs.dir === undefined) {
      options.docs.dir = defaultDir
    }

    if (!options.docs.prefix) {
      options.docs.prefix = defaultPrefix
    }

    return exists(this.options.srcDir, options.docs.dir)
  },
  async generateRoutes (data, prefix, staticRoot) {
    let home = '/'
    if (this.$press.i18n) {
      home = `/${this.$press.i18n.locales[0].code}`
    }
    return [
      {
        route: prefix(''),
        payload: await importModule(`${staticRoot}/sources${this.$press.docs.prefix}${home}`)
      },
      ...Object.values(data.sources).map(async ({ path }) => ({
        route: routePath(path),
        payload: await importModule(`${staticRoot}/sources/${path}`)
      }))
    ]
  },
  async ready () {
    if (this.$press.docs.search) {
      await this.requireModule({
        src: '@nuxtjs/lunr-module',
        options: {
          globalComponent: false,
          languages: (this.$press.i18n && this.$press.i18n.locales.map(l => l.code.split('-').shift())) || []
        }
      })

      let documentIndex = 1
      this.nuxt.hook('press:docs:page', ({ toc, source }) => {
        this.nuxt.callHook('lunr:document', {
          locale: (source.locale || '').split('-').shift(),
          document: {
            id: documentIndex,
            title: source.title,
            body: markdownToText(source.body)
          },
          meta: source.path
        })

        documentIndex++
      })
    }
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
    dir: undefined,
    prefix: undefined,
    title: 'My Documentation',
    search: true,
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
