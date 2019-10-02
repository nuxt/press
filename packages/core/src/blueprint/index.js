import path from 'path'
import defu from 'defu'
import { sortRoutes } from '@nuxt/utils'
import {
  Blueprint,
  abstractGuard,
  runOnceGuard,
  runOnceGuardBlocking,
  exists
} from '@nuxt/blueprints'
import {
  SSE,
  PromisePool,
  getDirsAsArray,
  ensureDir,
  importModule,
  loadConfig,
  saveConfig,
  saveFiles,
  saveJsonFiles,
  normalizePathPrefix,
  normalizePath,
  normalizePaths
} from '@nuxt-press/utils'

import coreApi from './api'
import source from './source'

export default class PressBlueprint extends Blueprint {
  static id = 'press'
  static configs = {}

  static modeInstances = []

  constructor (nuxt, options) {
    abstractGuard(new.target, 'PressBlueprint')

    options = {
      pluginsStrategy(nuxtPlugins, newPlugins) {
        const corePlugins = newPlugins.filter(p => p.src.includes('/core/plugins'))
        nuxtPlugins.push(...corePlugins)

        const modePlugins = newPlugins.filter(p => !p.src.includes('/core/plugins'))
        nuxtPlugins.push(...modePlugins)
      },
      webpackAliases: [
        PressBlueprint.id,
        ['vue$', 'vue/dist/vue.esm.js']
      ],
      ...options
    }

    super(nuxt, options)

    this.constructor.modeInstances.push(this)

    this.coreDir = __dirname
  }

  static async loadRootConfig ({ rootDir, options: nuxtOptions, config }) {
    // Note: for clarity, in static methods `this` refers to
    // the static this, not the this of the instance
    if (!this.configs[rootDir]) {
      const rootId = PressBlueprint.id

      config = await loadConfig({
        rootId,
        rootDir,
        config
      })

      // TODO: we should choose how Nuxt/Press should be configured
      // all these possibilies are confusing
      this.configs[rootDir] = defu(config, nuxtOptions[rootId] || {})
    }

    return this.configs[rootDir]
  }

  static async register (moduleContainer, config) {
    const nuxt = moduleContainer.nuxt

    // TODO: isStandalone is not correctly implemented yet for custom id's
    const isStandalone = config.$standalone === this.id

    // keep track if a mode was registered or nothing
    // this allows us to run in standalone mode with a custom mode id
    let modeRegistered = false

    const modeInstances = {}
    for (const key in config) {
      // always register the blueprint mode if config exists for it
      // dont bother checking dir
      if (key === this.id || config[key].blueprint === this.id) {
        modeInstances[key] = new this(nuxt, { id: key })
        modeInstances[key].requiredModules = moduleContainer.requiredModules

        modeRegistered = true
      }
    }

    // register as well if no modeInstance has been created yet
    // but we are running in standalone mode or
    // we are _not_ running in standalone mode and a default dir exists
    if (!modeRegistered) {
      if (isStandalone || (!config.$standalone && await exists(path.join(nuxt.options.srcDir, this.defaultConfig.dir)))) {
        modeInstances[this.id] = new this(nuxt, { id: this.id })
        modeInstances[this.id].requiredModules = moduleContainer.requiredModules
      }
    }

    return modeInstances
  }

  async loadConfig (extraConfig = {}) {
    // retrieve rootConfig from static instance
    this.rootConfig = await this.constructor.loadRootConfig({
      rootDir: this.nuxt.options.rootDir,
      options: this.nuxt.options,
      config: extraConfig
    })

    this.rootConfig.id = PressBlueprint.id

    let config
    if (this.rootConfig[this.id]) {
      config = this.rootConfig[this.id]
    } else {
      config = this.constructor.defaultConfig || {}
    }

    config.source = source

    return config
  }

  setLocales () {
    // dont bother if the blueprint doesnt support localization
    if (!this.constructor.features.localization) {
      this.config.$hasLocales = false
      return
    }

    // prefer locales defined in the current mode config,
    // otherwise use the root conf
    const locales = this.config.locales || this.rootConfig.locales || (this.rootConfig.i18n && this.rootConfig.i18n.locales)

    // validate locales so from now on we know its an array
    if (locales && Array.isArray(locales)) {
      this.config.$locales = Array.from(locales)
    }

    this.config.$hasLocales = !!this.config.$locales
  }

  // coreSetup only need to run once
  async coreSetup () {
    // track if nuxt is going to generate the project
    this.rootConfig.isGenerating = this.nuxt.options._generate || this.nuxt.options.target === 'static'

    // Enable all of https://preset-env.cssdb.org/features
    this.nuxt.options.build.postcss.preset.stage = 0

    // Hable is used in plugin middleware but needs to be transpiled
    this.nuxt.options.build.transpile = this.nuxt.options.build.transpile || []
    this.nuxt.options.build.transpile.push('hable')
    this.nuxt.options.build.transpile.push(/^@nuxt-press\//)

    // Register default stylesheets
    const styles = []
    if (!this.blueprintOptions.naked) {
      styles.push(...[
        'normalize.css/normalize.css',
        'wysiwyg.css/wysiwyg.css',
        path.join(this.coreDir, '..', 'prism.css')
      ])
    }

    // Always add nuxt.press.css if it exists
    if (await exists(path.join(this.nuxt.options.srcDir, 'nuxt.press.css'))) {
      styles.push('~/nuxt.press.css')
    }

    if (styles.length) {
      this.addStyles(styles)
    }

    // Automatically register module dependencies
    this.requireModule({
      src: '@nuxt/http',
      options: { browserBaseURL: '/' }
    })

    // Add a helper for writing JSON responses
    // Note: this should be added as first
    this.addServerMiddleware((_, res, next) => {
      res.json = (data) => {
        res.type = 'application/json'
        res.write(JSON.stringify(data))
        res.end()
      }
      next()
    })

    // Enable hot reload for Markdown files in dev mode
    if (this.nuxt.options.dev) {
      const ssePool = new SSE()

      const rootDir = path.join(this.nuxt.options.buildDir, PressBlueprint.id)

      this.sseSourceEvent = async (event, payload) => {
        if (event === 'reload') {
          await this.saveDataSources(rootDir, payload.data)
          ssePool.broadcast('change', payload.source)
          return
        }

        await this.saveDataSources(rootDir, { sources: { source: payload } })
        ssePool.broadcast(event, payload)
      }

      // call this on super and not this due to error
      // handler we always add as convenience
      this.addServerMiddleware({
        path: '/__press/hot',
        handler: (req, res) => ssePool.subscribe(req, res)
      })
    }

    const api = this.createApi()
    if (api && api.source) {
      this.addServerMiddleware({
        path: '/_press/sources/',
        handler: api.source
      })
    }
  }

  async setup () {
    // load the saved configuration
    this.config = await this.loadConfig()

    // try to set/validate locales so we dont
    // have to do that later anyjore
    this.setLocales()

    // we need to use a blocking runOnce guard here,
    // i.e. the setups for all blueprints run at once
    // but we really need the coreSetup to finish first
    // before any other setup stuff is run
    // so eg the json middleware function is added first
    const resolveGuard = await runOnceGuardBlocking(PressBlueprint, 'coreSetup')
    if (resolveGuard) {
      await this.coreSetup()
      resolveGuard()
    }

    await super.setup()

    // bind all source functions to this context
    // is a small improvement instead of using
    // .call(this) every time later on
    if (this.config.source) {
      for (const key in this.config.source) {
        this.config.source[key] = this.config.source[key].bind(this)
      }
    }

    // create backwards compatible template options
    this.templateOptions = {
      id: this.id,
      dev: this.nuxt.options.dev,
      rootOptions: this.rootConfig,
      options: this.config
    }

    this.rootConfig[`$${this.constructor.id}`] = true
    this.config.prefix = normalizePathPrefix(this.config.prefix)
  }

  // init needs to run for each derived nuxt/press module
  async init () {
    this.nuxt.hook('build:before', () => this.buildBefore())
    this.nuxt.hook('build:done', () => this.buildDone())
    this.nuxt.hook('builder:prepared', (builder) => {
      // Always turn-off the default page, as Nuxt.js will
      // falsely think there are no pages/routes
      builder._defaultPage = false

      return this.builderPrepared()
    })

    // only add generate hooks if needed
    if (this.rootConfig.isGenerating) {
      this.nuxt.hook('generate:distCopied', () => this.generateDistCopied())
    }

    if (runOnceGuard(PressBlueprint, 'coreInit')) {
      this.nuxt.hook('build:templates', templateContext => PressBlueprint.buildTemplates(templateContext))
      this.nuxt.hook('build:extendRoutes', routes => PressBlueprint.buildExtendRoutes(routes))

      if (this.rootConfig.isGenerating) {
        this.nuxt.hook('generate:extendRoutes', routes => PressBlueprint.generateExtendRoutes(routes))
      }
    }
  }

  async autodiscover (rootDir) {
    const files = [undefined, undefined]
    const autodiscoverOpts = {
      // ignore all files in the root of the blueprint folder
      filter: ({ dir }) => !!dir
    }

    if (runOnceGuard(PressBlueprint, 'autodiscover')) {
      PressBlueprint.files = await super.autodiscover(this.coreDir, autodiscoverOpts)
      files[0] = PressBlueprint.files
    }

    if (!this.files) {
      this.files = await super.autodiscover(rootDir, autodiscoverOpts)
    }

    files[1] = this.files

    return files
  }

  createApi () {
    const rootDir = path.join(this.nuxt.options.buildDir, PressBlueprint.id, 'static')
    const apiOptions = {
      rootDir,
      id: this.id,
      prefix: this.config.prefix,
      dev: this.nuxt.options.dev
    }

    let api = coreApi.call(this, apiOptions)

    if (typeof this.config.api === 'function') {
      api = {
        ...api,
        ...this.config.api.call(this, apiOptions)
      }
    }

    return api
  }

  // TODO: why is the css.splice (and thus this special fn) necessary?
  // Cant we trust push order in that core pushed first,
  // then eg the derived docs mode blueprint?
  addTheme (themePath) {
    if (this.blueprintOptions.naked) {
      return
    }

    let addIndex = this.nuxt.options.css
      .findIndex(css => typeof css === 'string' && css.match(/nuxt\.press\.css$/))
    if (addIndex === -1) {
      addIndex = this.nuxt.options.css
        .findIndex(css => typeof css === 'string' && css.match(/prism\.css$/))
    }

    this.nuxt.options.css.splice(addIndex + 1, 0, themePath)
  }

  // hot reloading passes data through as arg
  async saveDataSources (rootDir, data) {
    const { topLevel, sources } = data || this.data

    if (topLevel) {
      await saveJsonFiles(topLevel, path.join(rootDir, this.id), fileName => `${fileName.toLowerCase()}.json`)
    }

    if (sources) {
      const staticRoot = path.join(rootDir, 'sources')
      await saveJsonFiles(sources, staticRoot, (fileName, source) => {
        let sourceFile = '.json'
        if (source.path.endsWith('/')) {
          sourceFile = `index${sourceFile}`
        }

        return path.join(staticRoot, `${source.path.toLowerCase()}`, sourceFile)
      })
    }
  }

  // abstract methods for mode derivates to implement
  loadData () {}
  buildBefore () {}
  buildDone () {}
  createGenerateRoutes () {}

  async builderPrepared () {
    const [coreFiles, files] = await this.autodiscover()

    if (coreFiles) {
      PressBlueprint.templates = await this.resolveFiles(coreFiles, `${PressBlueprint.id}/core`)
    }

    if (files) {
      this.templates = await this.resolveFiles(files, `${PressBlueprint.id}/${this.constructor.id}`)
    }

    this.data = await this.loadData()

    const rootDir = path.join(this.nuxt.options.buildDir, PressBlueprint.id, 'static')
    await this.saveDataSources(rootDir)

    if (this.data.static) {
      if (this.config.extendStaticFiles && typeof this.config.extendStaticFiles === 'function') {
        await this.config.extendStaticFiles.call(this, this.data.static)
      }

      const staticRoot = path.join(this.nuxt.options.srcDir, this.nuxt.options.dir.static)
      await saveFiles(this.data.static, staticRoot)
    }
  }

  static buildTemplates ({ templateVars }) {
    templateVars.middleware.push({
      name: 'press',
      dst: this.templates['middleware/press.tmpl.js']
    })
  }

  createRoutes () {
    const routeName = `source-${this.id.toLowerCase()}`

    if (this.config.$hasLocales) {
      const locales = this.config.$locales.map(locale => locale.code)
      locales.sort()

      return [{
        name: `${routeName}-locales-${locales.join('_')}`,
        path: `${this.config.prefix}/:locale(${locales.join('|')})?/:source(.*)?`,
        component: PressBlueprint.templates['pages/source.tmpl.vue'],
        meta: { id: this.id, bp: this.constructor.id, source: true }
      }]
    }

    return [{
      name: routeName,
      path: `${this.config.prefix}/:source(.*)?`,
      component: PressBlueprint.templates['pages/source.tmpl.vue'],
      meta: { id: this.id, bp: this.constructor.id, source: true }
    }]
  }

  static async buildExtendRoutes (nuxtRoutes) {
    const allRoutes = []
    for (const modeInstance of this.modeInstances) {
      const routes = modeInstance.createRoutes()
      if (routes) {
        const { srcDir, buildDir } = modeInstance.nuxt.options
        for (const route of routes) {
          if (
            // TODO: test if this still works
            !route.component ||
            route.component.startsWith(srcDir) ||
            route.component.startsWith(buildDir)
          ) {
            // this is a fix for hmr, it already has full path set
            continue
          }

          const componentPath = path.join(srcDir, route.component)
          if (await exists(componentPath)) {
            route.component = componentPath
          } else {
            route.component = path.join(buildDir, route.component)
          }
        }

        allRoutes.push(...routes)
      }
    }

    // sort the routes as the pages blueprint
    // adds a very greedy route
    const sortedRoutes = sortRoutes(allRoutes)

    // fix sort issue in nuxt.sortRoutes
    nuxtRoutes.push(...allRoutes.sort((a, b) => {
      if (a.name === 'source-pages') {
        return 1
      }

      if (b.name === 'source-pages') {
        return -1
      }

      return 0
    }))
  }

  getGenerateRoot () {
    return path.join(this.nuxt.options.generate.dir, `_${PressBlueprint.id}`)
  }

  async generateDistCopied () {
    const rootDirGenerate = this.getGenerateRoot()

    await ensureDir(rootDirGenerate)
    await this.saveDataSources(rootDirGenerate)
  }

  // the instance method generateExtendRoutes created the routes
  // which needs to be generate for a single mode instance
  async generateExtendRoutes() {
    const rootDirGenerate = this.getGenerateRoot()
    const prefixRoute = route => `${this.config.prefix}${route}`

    let routes = await this.createGenerateRoutes(rootDirGenerate, prefixRoute)

    // we could maybe do this in static generateExtendRoutes?
    if (this.config.extendStaticRoutes) {
      await Promise.all(routes.map(async route => {
        route.payload = await route.payload
      }))

      const routeEntries = routes.map(route => [route.route, route])
      const routesHashmap = Object.fromEntries(routeEntries)

      // a proxy is used so users can assign static imports
      // by simple using key,value assignment where the key is the path
      // and the value the static source, thus without knowing the underlying
      // structure of our routes object
      const routeProxy = new Proxy(routesHashmap, {
        get (_, prop) {
          return routes[prop].payload
        },
        set (_, prop, value) {
          routes[prop] = {
            route: prop,
            payload: value
          }
          return routes[prop].payload
        }
      })

      // provide a staticImport method which the user can
      // use to easily retrieve existing source files
      async function staticImport (...args) {
        const pathPrefixes = ['sources', '']
        while (pathPrefixes.length) {
          const pathPrefix = pathPrefixes.pop()
          const source = path.join(rootDirGenerate, pathPrefix, ...args)

          if (await exists(source)) {
            return importModule(source)
          }
        }
      }

      await this.config.extendStaticRoutes.call(this, routeProxy, staticImport)

      routes = Object.values(routesHashmap)
    }

    return routes
  }

  // the static generateExtendRoutes method calls the similar named
  // instance method on all the mode instances which have been loaded
  static async generateExtendRoutes (extendRoutes) {
    let routes = []
    await Promise.all(this.modeInstances.map(async (instance) => {
      const instanceRoutes = await instance.generateExtendRoutes()
      routes.push(...instanceRoutes)
    }))

    await Promise.all(routes.map(async route => {
      route.payload = await route.payload
    }))

    // remove already listed routes for which we have a static payload
    for (let index = 0; index < extendRoutes.length; index++) {
      const found = !!routes.find(({ route }) => route === extendRoutes[index].route || route === normalizePath(extendRoutes[index].route))

      if (found) {
        extendRoutes.splice(index, 1)
        index--
      }
    }

    extendRoutes.push(...routes)
  }
}
