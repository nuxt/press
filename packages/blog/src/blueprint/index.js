import path from 'path'
import chokidar from 'chokidar'
import defu from 'defu'
import { Blueprint as PressBlueprint } from '@nuxt-press/core'
import {
  normalizeConfig,
  markdownToText,
  getDirsAsArray,
  importModule,
  normalizePath,
  writeJson,
  ensureDir
} from '@nuxt-press/utils'

import loadSources, { _parseEntry } from './data'
import api from './api'
import source from './source'

export default class PressBlogBlueprint extends PressBlueprint {
  static id = 'blog'

  static features = {
    singleton: true,
    localization: false
  }

  static defaultConfig = {
    dir: 'blog',
    prefix: '/blog/',
    title: 'A NuxtPress Blog',
    links: [],
    icons: [],
    feed: {
      // Replace with final link to your feed
      link: 'https://nuxt.press',
      // The <description> RSS tag
      description: 'A NuxtPress Blog Description',
      // Used in RFC4151-based RSS feed entry tags
      tagDomain: 'nuxt.press',
      // Final RSS path
      path: options => `${options.prefix}rss.xml`
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

    // we need this for index/archive pages
    // see core/blueprint/plugins/press
    this.rootConfig.blogPrefixes = this.rootConfig.blogPrefixes || {}
    this.rootConfig.blogPrefixes[this.id] = this.config.prefix

    const api = this.createApi()

    this.addServerMiddleware({
      path: `/_press/blog${this.config.prefix}`,
      handler: (req, res, next) => {
        if (req.url === '/index.json') {
          api.index(req, res, next)
          return
        }

        if (req.url === '/archive.json') {
          api.archive(req, res, next)
          return
        }

        next()
      }
    })
  }

  async loadConfig (extraConfig) {
    const config = await super.loadConfig(extraConfig)

    config.api = api
    config.source = source

    return config
  }

  loadData () {
    // this method is externalized to improve readability
    return loadSources.call(this)
  }

  createRoutes () {
    const routeName = `source-${this.id.toLowerCase()}`

    const meta = { id: this.id, bp: this.constructor.id }

    return [{
      name: `${routeName}-index`,
      path: `${this.config.prefix}/`,
      component: this.templates['pages/index.vue'],
      meta
    }, {
      name: `${routeName}-archive`,
      path: `${this.config.prefix}/archive/`,
      component: this.templates['pages/archive.vue'],
      meta
    },
    ...super.createRoutes()
    ]
  }

  async createGenerateRoutes (rootDir, prefix) {
    return [
      ...Object.keys(this.data.topLevel).map(route => ({
        route: normalizePath(route, { index: false }),
        payload: importModule(rootDir, this.id, `${route}.json`)
      })),
      ...Object.keys(this.data.sources).map(route => ({
        route,
        payload: importModule(rootDir, 'sources', route)
      }))
    ]
  }

  async buildDone () {
    if (!this.nuxt.options.dev) {
      return
    }

    let updatedEntry

    const mdProcessor = await this.config.source.processor()

    // make sure watchPaths is an array
    const watchPaths = getDirsAsArray(this.config.dir)

    const watcher = chokidar.watch(watchPaths.map(path => `${path}${path ? '/' : ''}**/*.md`), {
      cwd: this.options.srcDir,
      ignoreInitial: true,
      ignored: 'node_modules/**/*'
    })

    const parseEntry = _parseEntry.bind(this)

    watcher.on('add', async (path) => {
      updatedEntry = await parseEntry.call(this, path, mdProcessor)
      this.sseSourceEvent('add', updatedEntry)
    })

    watcher.on('change', async (path) => {
      updatedEntry = await parseEntry.call(this, path, mdProcessor)
      this.sseSourceEvent('change', updatedEntry)
    })

    watcher.on('unlink', path => this.sseSourceEvent('unlink', { path }))
  }
}
