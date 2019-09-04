import path from 'path'
import chokidar from 'chokidar'
import { Blueprint as PressBlueprint } from '@nuxtpress/core'
import {
  normalizeConfig,
  getDirsAsArray,
  importModule,
  normalizePath,
  normalizeSourcePath
} from '@nuxtpress/utils'

import loadSources, { _parseSlides } from './data'
import api from './api'

export default class PressSlidesBlueprint extends PressBlueprint {
  static id = 'slides'

  static features = {
    singleton: true,
    localization: false
  }

  static defaultConfig = {
    dir: 'slides',
    prefix: '/slides/'
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

    // we need this for index pages
    // see core/blueprint/plugins/press
    this.rootConfig.slidesPrefixes = this.rootConfig.slidesPrefixes || {}
    this.rootConfig.slidesPrefixes[this.id] = this.config.prefix

    const api = this.createApi()

    this.addServerMiddleware({
      path: `/_press/slides${this.config.prefix}`,
      handler: (req, res, next) => {
        if (req.url === '/index.json') {
          api.index(req, res, next)
          return
        }

        next()
      }
    })
  }

  async loadConfig (extraConfig) {
    const config = await super.loadConfig(extraConfig)

    config.api = api
    return config
  }

  loadData () {
    // this method is externalized to improve readability
    return loadSources.call(this)
  }

  createRoutes () {
    const routeName = `source-${this.id.toLowerCase()}`

    return [{
      name: `${routeName}-archive`,
      path: `${this.config.prefix}/`,
      component: this.templates['pages/index.vue'],
      meta: { id: this.id, bp: this.constructor.id }
    },
    ...super.createRoutes()
    ]
  }

  createGenerateRoutes (rootDir, prefix) {
    return [
      ...Object.keys(this.data.topLevel).map(async route => {
        route = normalizePath(route, true, false)
        return {
          route: normalizePath(normalizeSourcePath(route)),
          payload: await importModule(rootDir, this.id, `${route}.json`)
        }
      }),
      ...Object.keys(this.data.sources).map(async route => ({
        route: normalizePath(route),
        payload: await importModule(rootDir, 'sources', route)
      }))
    ]
  }

  async buildDone () {
    if (!this.nuxt.options.dev) {
      return
    }

    const mdProcessor = await this.config.source.processor()

    // make sure watchPaths is an array
    const watchPaths = getDirsAsArray(this.config.dir)

    const watcher = chokidar.watch(watchPaths.map(path => `${path}${path ? '/' : ''}**/*.md`), {
      cwd: this.options.srcDir,
      ignoreInitial: true,
      ignored: 'node_modules/**/*'
    })

    const parseSlides = _parseSlides.bind(this)

    watcher.on('change', async (path) => {
      const updatedSlides = await parseSlides.call(this, path, mdProcessor)
      this.sseSourceEvent('change', updatedSlides)
    })
    watcher.on('add', async (path) => {
      const updatedSlides = await parseSlides.call(this, path, mdProcessor)
      this.sseSourceEvent('add', updatedSlides)
    })
    watcher.on('unlink', path => this.sseSourceEvent('unlink', { path }))
  }
}
