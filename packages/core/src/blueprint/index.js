import path from 'path'
import defu from 'defu'
import {
  Blueprint,
  SSE,
  PromisePool,
  getDirsAsArray,
  existsAsync,
  ensureDir,
  importModule,
  loadConfig,
  saveConfig,
  saveFiles,
  saveJsonFiles,
  normalizeConfig,
  normalizePathPrefix,
  normalizePaths,
  trimSlash
} from '@nuxtpress/utils'
import coreApi from './api'

export default class PressBlueprint extends Blueprint {
  static id = 'press'
  static configs = {}
  static autodiscovered = false
  static coreSetupDone = false

  constructor(nuxt, options) {
    if (new.target === 'PressBlueprint') {
      throw new Error('PressBlueprint is an abstract class, do not instantiate it directly')
    }

    options = {
      webpackAliases: [
        PressBlueprint.id,
        ['vue$', 'vue/dist/vue.esm.js']
      ],
      ...options
    }

    super(nuxt, options)

    this.coreDir = __dirname
  }

  static async loadRootConfig({ rootDir, options: nuxtOptions, config }) {
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

  static async register(moduleContainer, config) {
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
      if (isStandalone || (!config.$standalone && await existsAsync(path.join(nuxt.options.srcDir, this.defaultConfig.dir)))) {
        modeInstances[this.id] = new this(nuxt, { id: this.id })
        modeInstances[this.id].requiredModules = moduleContainer.requiredModules
      }
    }

    return modeInstances
  }

  async loadConfig(extraConfig = {}) {
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
      config = this.constructor.defaultConfig
    }

    return config
  }

  setLocales() {
    // dont bother if the blueprint doesnt support localization
    if (!this.constructor.features.localization) {
      this.config.$hasLocales = false
      return
    }

    // prefer locales defined in the current mode config,
    // otherwise use the root conf
    let locales = this.config.locales || this.rootConfig.locales || (this.rootConfig.i18n && this.rootConfig.i18n.locales)

    // validate locales so from now on we know its an array
    if (locales && Array.isArray(locales)) {
      this.config.$locales = Array.from(locales)
    }

    this.config.$hasLocales = !!this.config.$locales
  }

  // coreSetup only need to run once
  async coreSetup() {
    if (PressBlueprint.coreSetupDone) {
      return
    }
    PressBlueprint.coreSetupDone = true

    // Enable all of https://preset-env.cssdb.org/features
    this.nuxt.options.build.postcss.preset.stage = 0

    // Hable is used in plugin middleware but needs to be transpiled
    this.nuxt.options.build.transpile = this.nuxt.options.build.transpile || []
    this.nuxt.options.build.transpile.push('hable')

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
    if (await existsAsync(path.join(this.nuxt.options.srcDir, 'nuxt.press.css'))) {
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
    super.addServerMiddleware((_, res, next) => {
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
      super.addServerMiddleware({
        path: '/__press/hot',
        handler: (req, res) => ssePool.subscribe(req, res)
      })
    }

    const api = this.createApi()
    if (api && api.source) {
      this.addServerMiddleware((req, res, next) => {
        if (!req.url.startsWith('/api/source/')) {
          return next()
        }

        const sourcePath = trimSlash(req.url.slice(12))
        api.source(req, res, next, sourcePath)
      })
    }
  }

  async setup() {
    // load the saved configuration
    this.config = await this.loadConfig()

    // try to set/validate locales so we dont
    // have to do that later anyjore
    this.setLocales()

    // create backwards compatible template options
    this.templateOptions = {
      id: this.id,
      dev: this.nuxt.options.dev,
      rootOptions: this.rootConfig,
      options: this.config
    }

    this.rootConfig[`$${this.constructor.id}`] = true

    this.config.$normalizedPrefix = normalizePathPrefix(this.config.prefix)

    await this.coreSetup()
    await super.setup()
  }

  // init needs to run for each derived nuxt/press module
  async init() {
    await this.setup()

    this.nuxt.hook('build:before', () => this.buildBefore())
    this.nuxt.hook('builder:prepared', (builder) => {
      // Always turn-off the default page, as Nuxt.js will
      // falsely think there are no pages/routes
      builder._defaultPage = false

      return this.builderPrepared()
    })

    if (!PressBlueprint.buildTemplatesHookAdded) {
      this.nuxt.hook('build:templates', (templateContext) => this.buildTemplates(templateContext))
      PressBlueprint.buildTemplatesHookAdded = true
    }

    this.nuxt.hook('build:extendRoutes', (routes) => this.buildExtendRoutes(routes))
    this.nuxt.hook('build:done', () => this.buildDone())

    // only add generate hooks if needed
    if (!(this.nuxt.options._generate || this.nuxt.options.target === 'static')) {
      return
    }

    this.nuxt.hook('generate:distCopied', () => this.generateDistCopied())

    // the generateRoutesHookAdded should only be added once
    if (!PressBlueprint.generateRoutesHookAdded) {
      this.nuxt.hook('generate:extendRoutes', (routes) => this.generateExtendRoutes(routes))

      PressBlueprint.generateRoutesHookAdded = true
    }
  }

  async autodiscover(rootDir) {
    const files = [undefined, undefined]
    const autodiscoverOpts = {
      // ignore all files in the root of the blueprint folder
      filter: ({ dir }) => !!dir
    }

    if (!PressBlueprint.autodiscovered) {
      PressBlueprint.files = await super.autodiscover(this.coreDir, autodiscoverOpts)
      files[0] = PressBlueprint.files

      PressBlueprint.autodiscovered = true
    }

    if (!this.files) {
      this.files = await super.autodiscover(rootDir, autodiscoverOpts)
    }

    files[1] = this.files

    return files
  }

  createApi() {
    const rootDir = path.join(this.nuxt.options.buildDir, PressBlueprint.id, 'static')
    const apiOptions = {
      rootDir,
      id: this.id,
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
  addTheme(themePath) {
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

  // auto wrap in an error handlerimport { createSidebar } from '../sidebar'

  addServerMiddleware(middleware) {
    super.addServerMiddleware((req, res, next) => {
      try {
        middleware(req, res, next)
      } catch (err) {
        next(err)
      }
    })
  }

  // hot reloading passes data through as arg
  async saveDataSources (rootDir, data) {
    const { topLevel, sources } = data || this.data

    if (topLevel) {
      await saveJsonFiles(topLevel, path.join(rootDir, this.id), (fileName) => `${fileName}.json`)
    }

    if (sources) {
      const staticRoot = path.join(rootDir, 'sources')
      await saveJsonFiles(sources, staticRoot, (fileName, source) => {
        let sourceFile = '.json'
        if (source.path.endsWith('/')) {
          sourceFile = `index${sourceFile}`
        }

        return path.join(staticRoot, `${source.path}`, sourceFile)
      })
    }
  }

  // abstract methods for mode derivates to implement
  loadData() {}
  buildBefore() {}
  buildDone() {}
  generateRoutes() {}

  async builderPrepared() {
    const [coreFiles, files] = await this.autodiscover()

    if (coreFiles) {
      PressBlueprint.templates = await this.resolveFiles(coreFiles, `${PressBlueprint.id}/core`)
    }

    this.templates = await this.resolveFiles(files, `${PressBlueprint.id}/${this.constructor.id}`)

    // TODO: remove: || {}
    this.data = await this.loadData() || {}

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

  buildTemplates({ templateVars }) {
    templateVars.middleware.push({
      name: 'press',
      dst: PressBlueprint.templates['middleware/press.tmpl.js']
    })
  }

  createRoutes() {
    const routes = []

    const prefix = this.config.$normalizedPrefix || ''
    const routeName = `source-${this.id.toLowerCase()}`

    if (this.config.$hasLocales) {
      const locales = this.config.$locales.map(locale => locale.code)
      locales.sort()

      routes.push({
        name: `${routeName}-locales-${locales.join('_')}`,
        path: `${prefix}/:locale(${locales.join('|')})?/:source(.*)?`,
        component: PressBlueprint.templates['pages/source.tmpl.vue'],
        meta: { id: this.id, source: true }
      })
    } else {
      routes.push({
        name: routeName,
        path: `${prefix}/:source(.*)?`,
        component: PressBlueprint.templates['pages/source.tmpl.vue'],
        meta: { id: this.id, source: true }
      })
    }

    return routes
  }

  // routes are split up as core provides both default routes
  // as a wrapper to make sure only valid routes are added
  // TODO: maybe we can just remove the below?
  async buildExtendRoutes(nuxtRoutes) {
    const routes = this.createRoutes()

    if (routes) {
      for (const route of routes) {
        if (
          // TODO: test if this still works
          route.component.startsWith(this.nuxt.options.srcDir) ||
          route.component.startsWith(this.nuxt.options.buildDir)
        ) {
          // this is a fix for hmr, it already has full path set
          continue
        }

        const componentPath = path.join(this.nuxt.options.srcDir, route.component)
        if (await existsAsync(componentPath)) {
          route.component = componentPath
        } else {
          route.component = path.join(this.nuxt.options.buildDir, route.component)
        }
      }

      nuxtRoutes.push(...routes)
    }
  }

  getGenerateRoot() {
    return path.join(this.nuxt.options.generate.dir, `_${PressBlueprint.id}`)
  }

  async generateDistCopied() {
    const rootDirGenerate = this.getGenerateRoot()

    await ensureDir(rootDirGenerate)
    await this.saveDataSources(rootDirGenerate)

    const prefixRoute = route => `${this.config.prefix}${route}`
    const routes = await this.generateRoutes(rootDirGenerate, prefixRoute)
    if (routes) {
      this.rootConfig.$generateRoutes = this.rootConfig.$generateRoutes || []

      if (Array.isArray(routes)) {
        this.rootConfig.$generateRoutes.push(...routes)
        return
      }

      this.rootConfig.$generateRoutes.push(routes)
    }

    if (!this.config.extendStaticRoutes) {
      return
    }

    // we call extendStaticRoutes in generate:before hook we means a user
    // probably doesnt have access to cross-press-mode source file
    // (i.e. he/she cant use blog source files for the docs mode)
    this.rootConfig.$extendStaticRoutes = this.rootConfig.$extendStaticRoutes || []
    this.rootConfig.$extendStaticRoutes.push(async (routes) => {
      // a proxy is used so users can assign static imports
      // by simple using key,value assignment where the key is the path
      // and the value the static source, thus without knowing the underlying
      // structure of our routes object
      const routeProxy = new Proxy(routes, {
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
          const path = path.join(rootDirGenerate, pathPrefix, ...args)

          if (await existsAsync(path)) {
            return importModule(path)
          }
        }
      }

      await this.config.extendStaticRoutes.call(this, routeProxy, staticImport)

      return routes
    })
  }

  async generateExtendRoutes(extendRoutes) {
    let routes = await Promise.all(this.rootConfig.$generateRoutes)

    if (this.rootConfig.$extendStaticRoutes) {
      const routeEntries = routes.map(route => [route.route, route])
      const routesHashmap = Object.fromEntries(routeEntries)

      for (const $extendStaticRoutes of this.rootConfig.$extendStaticRoutes) {
        await $extendStaticRoutes(routesHashmap)
      }

      routes = Object.values(routesHashmap)
    }

    // remove already listed routes for which we have a static payload
    for (let index = 0; index < extendRoutes.length; index++) {
      const found = !!routes.find(route => route.route === extendRoutes[index].route)

      if (found) {
        extendRoutes.splice(index, 1)
        index--
      }
    }

    extendRoutes.push(...routes)
  }
}
