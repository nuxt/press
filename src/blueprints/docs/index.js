import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

import {
  importModule,
  join,
  exists,
  writeJson,
  updateConfig,
  routePath,
  normalizePaths,
  markdownToText,
  trimSlash,
  getDirsAsArray
} from '../../utils'

import { templates, defaultDir, defaultPrefix } from './constants'
import { tocToTree, createSidebar } from './sidebar'
import data from './data'

let mdProcessor

export default {
  data,
  templates,
  enabled ({ rootOptions, options }) {
    if (rootOptions.$standalone === 'docs') {
      options.dir = options.dir || ''
      options.prefix = normalizePaths(options.prefix, true) || '/'
      options.$normalizedPrefix = trimSlash(options.prefix || '')
      return true
    }

    if (options.dir === undefined) {
      options.dir = defaultDir
    }

    if (!options.prefix) {
      options.prefix = defaultPrefix
    } else {
      options.prefix = normalizePaths(options.prefix, true)
    }

    options.$normalizedPrefix = trimSlash(options.prefix || '')

    const dirs = getDirsAsArray(options.dir)
    for (const dir of dirs) {
      if (exists(this.options.srcDir, dir)) {
        return true
      }
    }
  },
  async generateRoutes ({ rootOptions, data }, prefix, staticRoot) {
    let home = '/'
    if (rootOptions.i18n) {
      home = `/${rootOptions.i18n.locales[0].code}`
    }
    home = prefix(home)

    return [
      {
        route: prefix(''),
        payload: await importModule(`${staticRoot}/sources${home}`)
      },
      ...Object.values(data.sources).map(async ({ path }) => ({
        route: routePath(path),
        payload: await importModule(`${staticRoot}/sources/${path}`)
      }))
    ]
  },
  async ready ({ rootOptions, options }) {
    if (!options.search) {
      return
    }

    let languages = []
    if (rootOptions.i18n && rootOptions.i18n.locales) {
      languages = rootOptions.i18n.locales.map(l => l.code)
    } else {
      // make sure to turn this off if there is no i18n,
      // we dont check it in the templates
      options.configPerLocale = false
    }

    await this.requireModule({
      src: '@nuxtjs/lunr-module',
      options: {
        globalComponent: false,
        languages
      }
    })

    let documentIndex = 1
    this.nuxt.hook('press:docs:page', ({ toc, source }) => {
      this.nuxt.callHook('lunr:document', {
        locale: source.locale,
        document: {
          id: documentIndex,
          title: source.title,
          body: markdownToText(source.body)
        },
        meta: {
          to: source.path,
          title: source.title
        }
      })

      documentIndex++
    })
  },
  build: {
    before () {
      this.$addPressTheme('blueprints/docs/theme.css')
    },
    async compile (context) {
      const { blueprintId, rootId, rootOptions, id, options } = context
      const pluginPath = join(this.options.buildDir, rootId, blueprintId, 'plugins')

      let configPrefixes = ['']
      let sidebarPrefixes = ['']

      if (options.configPerLocale && rootOptions.i18n) {
        configPrefixes = rootOptions.i18n.locales.map(locale => `/${typeof locale === 'object' ? locale.code : locale}`)
      }
      if (!options.localizedSidebar && rootOptions.i18n) {
        sidebarPrefixes = rootOptions.i18n.locales.map(locale => `/${typeof locale === 'object' ? locale.code : locale}`)
      }

      for (const configPrefix of configPrefixes) {
        // save pages.json
        const config = { pages: {}, sidebars: {} }
        // only export the minimum of props we need
        for (const path in options.$pages) {
          // only export pages starting with the (locale) prefix for this config
          if (!path.startsWith(configPrefix)) {
            continue
          }

          const page = options.$pages[path]
          const [toc = []] = page.toc || []

          config.pages[path] = {
            title: page.meta.title || toc[1] || '',
            description: page.meta.description || '',
            hash: (toc[2] && toc[2].substr(path.length)) || '',
            meta: {
              ...page.meta,
              title: undefined,
              description: undefined
            }
          }
        }

        let sidebarConfig = options.sidebar
        if (typeof sidebarConfig === 'string') {
          sidebarConfig = [sidebarConfig]
        }

        if (Array.isArray(sidebarConfig)) {
          sidebarConfig = {
            '/': sidebarConfig
          }
        }

        for (const sidebarPrefix of sidebarPrefixes) {
          if (configPrefix && sidebarPrefix !== configPrefix) {
            continue
          }

          for (const path in sidebarConfig) {
            const normalizedPath = normalizePaths(path, true)

            const sidebarPath = `${sidebarPrefix}${normalizedPath}`
            config.sidebars[sidebarPath] = createSidebar(
              sidebarConfig[path].map(normalizePaths),
              options.$pages,
              sidebarPrefix
            )
          }
        }

        for (const path in options.$pages) {
          const page = options.$pages[path]
          if (page.meta && page.meta.sidebar === 'auto') {
            config.sidebars[path] = tocToTree(page.toc)
          }
        }

        writeJson(join(pluginPath, `config.${id}${configPrefix ? '.' : ''}${configPrefix.substr(1)}.json`), config, { spaces: 2 })
      }

      await updateConfig.call(this, context)
    },
    done (context) {
      if (!this.nuxt.options.dev) {
        return
      }

      const { id, options } = context

      // make sure watchPaths is an array
      const watchPaths = getDirsAsArray(options.dir)

      // the listener on fs changes
      const updateDocs = async (path) => {
        const docsData = await data.call(this, context)
        await updateConfig.call(this, context)
        const source = Object.values(docsData.sources).find(s => s.src === path) || {}
        this.$pressSourceEvent('reload', id, { data: docsData, source })
      }

      // watch all .md files in watch dir and subdirs
      // dont add folder seperator if dir was empty as we dont
      // want to listen on root
      const watcher = chokidar.watch(watchPaths.map(path => `${path}${path ? '/' : ''}**/*.md`), {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
      watcher.on('add', updateDocs)
      watcher.on('change', updateDocs)
      watcher.on('unlink', updateDocs)
    }
  },
  options: {
    dir: undefined,
    prefix: undefined,
    title: 'My Documentation',
    search: true,
    localizedSidebar: false,
    configPerLocale: true,
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
