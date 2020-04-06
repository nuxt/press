import path from 'path'
import chokidar from 'chokidar'
import { Blueprint as PressBlueprint } from '@nuxt-press/core'
import { exists } from '@nuxt/blueprints'
import {
  normalizeConfig,
  importModule
} from '@nuxt-press/utils'

import loadSources, { _parsePage } from './data'

export default class PressPagesBlueprint extends PressBlueprint {
  static id = 'pages'

  static features = {
    singleton: true,
    localization: false
  }

  constructor (nuxt, options = {}) {
    super(nuxt, normalizeConfig(options))
  }

  static async register (moduleContainer, config) {
    const nuxt = moduleContainer.nuxt

    const pagesRoot = path.join(
      nuxt.options.srcDir,
      nuxt.options.dir.pages
    )

    if (await exists(pagesRoot)) {
      return { [this.id]: new this(nuxt, { ...config, id: this.id }) }
    }
  }

  loadData () {
    // this method is externalized to improve readability
    return loadSources.call(this)
  }

  buildDone () {
    if (!this.nuxt.options.dev) {
      return
    }

    const parsePage = _parsePage.bind(this)

    const watcher = chokidar.watch(['pages/**/*.md'], {
      cwd: this.options.srcDir,
      ignoreInitial: true,
      ignored: 'node_modules/**/*'
    })
    watcher.on('change', async path => this.sseSourceEvent('change', await parsePage(path)))
    watcher.on('add', async path => this.sseSourceEvent('add', await parsePage(path)))
    watcher.on('unlink', path => this.sseSourceEvent('unlink', { path }))
  }

  createGenerateRoutes (rootDir, prefix) {
    if (!this.data || !this.data.sources) {
      return []
    }

    return Object.keys(this.data.sources).map((route) => {
      return {
        route,
        payload: importModule(rootDir, 'sources', route)
      }
    })
  }
}
