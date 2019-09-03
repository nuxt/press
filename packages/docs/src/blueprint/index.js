import path from 'path'
import chokidar from 'chokidar'
import defu from 'defu'
import { Blueprint as PressBlueprint } from '@nuxtpress/core'
import {
  normalizeConfig,
  markdownToText,
  getDirsAsArray,
  importModule,
  normalizeSourcePath,
  normalizePaths,
  writeJson,
  ensureDir
} from '@nuxtpress/utils'

import { createSidebar, tocToTree } from '../sidebar'
import loadSources from './data'
import source from './source'

export default class PressDocsBlueprint extends PressBlueprint {
  static id = 'docs'

  static features = {
    singleton: false,
    localization: true
  }

  static defaultConfig = {
    dir: 'docs',
    prefix: '/docs/',
    title: 'My Documentation',
    search: true,
    localizedSidebar: false,
    configPerLocale: true,
    nav: [],
    maxSidebarDepth: 2,
    metaSettings: {
      sidebarDepth: 1
    }
  }

  constructor (nuxt, options = {}) {
    options = {
      dir: __dirname,
      ...normalizeConfig(options)
    }

    super(nuxt, options)
  }

  async setup () {
    await super.setup()

    this.addTheme(path.join(__dirname, '..', 'theme.css'))

    let languages
    if (this.config.$locales) {
      languages = this.config.$locales.map(locale => locale.code)
    } else {
      // make sure to turn this off if there is no i18n,
      // we dont check it in the templates
      this.config.configPerLocale = false
    }

    if (!this.config.search) {
      return
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
  }

  async loadConfig (extraConfig) {
    const config = await super.loadConfig(extraConfig)
    config.source = source

    return config
  }

  loadData () {
    // this method is externalized to improve readability
    return loadSources.call(this)
  }

  async builderPrepared () {
    await super.builderPrepared()

    const pluginPath = path.join(this.nuxt.options.buildDir, PressBlueprint.id, this.constructor.id, 'plugins')
    await ensureDir(pluginPath)

    let configPrefixes = ['']
    let sidebarPrefixes = ['']

    if (this.config.configPerLocale && this.config.$hasLocales) {
      configPrefixes = this.config.$locales.map(locale => `/${locale.code}`)
    }
    if (!this.config.localizedSidebar && this.config.$hasLocales) {
      sidebarPrefixes = this.config.$locales.map(locale => `/${locale.code}`)
    }

    for (const configPrefix of configPrefixes) {
      // save pages.json
      const config = { nav: {}, pages: {}, sidebars: {} }

      if (this.config.nav) {
        config.nav = this.config.nav.map((link) => {
          const keys = Object.keys(link)
          if (keys.length > 1) {
            return link
          } else {
            return {
              text: keys[0],
              link: Object.values(link)[0]
            }
          }
        })
      }

      // only export the minimum of props we need
      for (const path in this.config.$pages) {
        // only export pages starting with the (locale) prefix for this config
        if (!path.startsWith(configPrefix)) {
          continue
        }

        const page = this.config.$pages[path]
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

      let sidebarConfig = this.config.sidebar
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
            this.config.$pages,
            sidebarPrefix
          )
        }
      }

      for (const path in this.config.$pages) {
        const page = this.config.$pages[path]
        if (page.meta && page.meta.sidebar === 'auto') {
          config.sidebars[path] = tocToTree(page.toc)
        }
      }

      await writeJson(
        path.join(pluginPath, `config.${this.id}${configPrefix ? '.' : ''}${configPrefix.substr(1)}.json`),
        config,
        { spaces: 2 }
      )
    }

    // await updateConfig.call(this, context)
  }

  async buildDone () {
    if (!this.nuxt.options.dev) {
      return
    }

    // make sure watchPaths is an array
    const watchPaths = getDirsAsArray(this.config.dir)

    // the listener on fs changes
    const updateDocs = async (path) => {
      const data = await this.loadData()
      const source = Object.values(data.sources).find(s => s.src === path) || {}
      this.sseSourceEvent('reload', {
        data,
        source
      })
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

  async generateRoutes (rootDir, prefix) {
    let home = '/'
    if (this.config.$hasLocales) {
      const [{ code: locale }] = this.config.$locales
      home = `/${locale}`
    }

    home = prefix(home)

    return [
      {
        route: prefix(''),
        payload: await importModule(rootDir, 'sources', home)
      },
      ...Object.values(this.data.sources).map(async ({ path }) => ({
        route: normalizeSourcePath(path),
        payload: await importModule(rootDir, 'sources', path)
      }))
    ]
  }
}
