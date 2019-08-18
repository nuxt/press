import defu from 'defu'
import PromisePool from './pool'
import resolve from './resolve'
import blueprints from './blueprints'
import {
  dirname,
  join,
  ensureDir,
  exists,
  writeFile,
  writeJson,
  loadConfig,
  updateConfig,
  walk,
  importModule
} from './utils'

if (!Object.fromEntries) {
  Object.fromEntries = (iterable) => {
    return [ ...iterable ].reduce((obj, [key, val]) => {
      obj[key] = val
      return obj
    }, {})
  }
}

const availableBlueprintIds = Object.keys(blueprints)
const registeredBlueprintIds = []

export async function registerBlueprints (rootId, options, blueprintIds = availableBlueprintIds) {
  // this: Nuxt ModuleContainer instance
  // rootId: root id (used to define directory and config key)
  // options: module options (as captured by the module function)
  // blueprints: blueprint loading order

  // Future-compatible flag
  this.$isGenerate = this.nuxt.options._generate || this.nuxt.options.target === 'static'

  // Sets this.options[rootId] ensuring
  // external config files have precendence
  options = await loadConfig.call(this, rootId, options)

  if (options.i18n) {
    const locales = options.i18n.locales
    this.options.i18n = {
      locales,
      defaultLocale: locales[0].code,
      vueI18n: {
        fallbackLocale: locales[0].code,
        messages: options.i18n.messages || {}
      }
    }
    this.requireModule('nuxt-i18n')
  }

  if (this.nuxt.options.dev) {
    const devStaticRoot = join(this.options.buildDir, rootId, 'static')
    this.saveDevDataSources = (...args) => {
      return new Promise(async (resolve) => {
        await saveDataSources.call(this, devStaticRoot, ...args)
        resolve()
      })
    }
  }

  this.$addPressTheme = (path) => {
    if (options.naked) {
      return
    }
    let addIndex = this.options.css
      .findIndex(css => typeof css === 'string' && css.match(/nuxt\.press\.css$/))
    if (addIndex === -1) {
      addIndex = this.options.css
        .findIndex(css => typeof css === 'string' && css.match(/prism\.css$/))
    }
    this.options.css.splice(addIndex + 1, 0, resolve(path))
  }

  // determine the possible blueprints to load
  // (check by default all to support auto-loading)
  const possibleBlueprints = blueprintIds
    // add all option keys if user has defined custom id
    .concat(Object.keys(options))
    // add standalone value (not required atm due to auto-loading)
    // .map(key => key === '$standalone' ? options.$standalone : key)
    // remove private keys
    .filter(key => !key.startsWith('$'))
    // unique keys only
    .filter((key, index, target) => index === target.findIndex(val => val === key))
    // common needs to be loaded last, keep others in same order
    .sort((a, b) => {
      if (a === 'common') {
        return 1
      }
      if (b === 'common') {
        return -1
      }

      return 0
    })

  for (const key of possibleBlueprints) {
    // we should only load a bleuprint if its any of the default blueprint ids
    // or when the blueprint config has a blueprint key which defines the type
    const blueprintId = (options[key] && options[key].blueprint) || key

    if (blueprintIds.includes(blueprintId)) {
      if (await registerBlueprint.call(this, blueprintId, rootId, key, options)) {
        registeredBlueprintIds.push(key)
      }
    }
  }
}

export async function registerBlueprint (blueprintId, rootId, id, rootOptions) {
  // Load blueprint specification
  const blueprint = blueprints[blueprintId]

  // Populate mode default options
  const options = defu(rootOptions[id] || {}, blueprint.options)
  // add ref back to rootOptions
  rootOptions[id] = options

  const context = {
    blueprintId,
    rootId,
    id,
    rootOptions,
    options,
    registeredBlueprintIds,
    availableBlueprintIds,
    data: undefined
  }

  // Determine if mode is enabled
  if (!blueprint.enabled.call(this, context)) {
    // Return if blueprint is not enabled
    return false
  }

  // also dont enable a blueprint when a custom id exists
  // with the same folder (default) configuration
  // (only applies to default blueprint ids)
  if (availableBlueprintIds.includes(id)) {
    for (const key in rootOptions) {
      if (key !== id &&
        typeof rootOptions[key] === 'object' &&
        rootOptions[key].blueprint === id &&
        rootOptions[key].dir === options.dir
      ) {
        return false
      }
    }
  }

  // Set flag to indicate blueprint was enabled (ie: options.$common = true)
  rootOptions[`$${blueprintId}`] = true
  rootOptions.dev = this.options.dev

  // Register server middleware
  if (blueprint.serverMiddleware) {
    for (let serverMiddleware of await blueprint.serverMiddleware.call(this, context)) {
      serverMiddleware = serverMiddleware.bind(this)
      this.addServerMiddleware(async (req, res, next) => {
        try {
          await serverMiddleware(req, res, next)
        } catch (err) {
          next(err)
        }
      })
    }
  }

  if (blueprint.ready) {
    await blueprint.ready.call(this, context)
  }

  let compileHookRan = false

  const {
    before: buildBefore,
    compile: buildCompile,
    done: buildDone
  } = blueprint.build || {}

  this.nuxt.addHooks({
    build: {
      // build:before hook
      before: async () => {
        const data = await blueprint.data.call(this, context)
        context.data = data

        if (data.static) {
          if (typeof options.extendStaticFiles === 'function') {
            // TODO: NOTE BREAKING CHANGE REVERSED ARGS
            await options.extendStaticFiles.call(this, context, data.static)
          }
          await saveStaticFiles.call(this, data.static)
        }

        const templates = await addTemplates.call(this, context, blueprint.templates)

        await updateConfig.call(this, context)

        if (blueprint.routes) {
          const routes = await blueprint.routes.call(this, context, templates)

          this.extendRoutes((nuxtRoutes) => {
            for (const route of routes) {
              if (exists(route.component)) {
                // this is a fix for hmr, it already has full path set
                continue
              }

              const path = join(this.options.srcDir, route.component)
              if (exists(path)) {
                route.component = path
              } else {
                route.component = join(this.options.buildDir, route.component)
              }
            }
            nuxtRoutes.push(...routes)
          })
        }

        if (!buildBefore) {
          return
        }

        await buildBefore.call(this, context)
      },
      // build:compile hook
      compile: async ({ name }) => {
        // compile hook should only run once for a blueprint
        if (compileHookRan) {
          return
        }
        compileHookRan = true

        const staticRoot = join(this.options.buildDir, rootId, 'static')
        await saveDataSources.call(this, staticRoot, id, context.data)

        if (!buildCompile) {
          return
        }

        await buildCompile.call(this, context)
      },
      // build:done hook
      done: async () => {
        if (!buildDone) {
          return
        }

        await buildDone.call(this, context)
      }
    }
  })

  if (!this.$isGenerate) {
    return true
  }

  let staticRootGenerate

  this.nuxt.addHooks({
    generate: {
      // generate:distCopied hook
      distCopied: async () => {
        staticRootGenerate = join(this.options.generate.dir, `_${rootId}`)

        await ensureDir(staticRootGenerate)
        await saveDataSources.call(this, staticRootGenerate, id, context.data)

        if (blueprint.generateRoutes) {
          rootOptions.$generateRoutes = rootOptions.$generateRoutes || []

          const prefixPath = path => `${options.prefix}${path}`
          const routes = await blueprint.generateRoutes.call(
            this,
            context,
            prefixPath,
            staticRootGenerate
          )

          if (!Array.isArray(routes)) {
            rootOptions.$generateRoutes.push(routes)
            return
          }

          rootOptions.$generateRoutes.push(...routes)
        }
      },
      // generate:extendRoutes hook
      extendRoutes: async (extendRoutes) => {
        const { extendStaticRoutes } = options

        if (extendStaticRoutes) {
          rootOptions.$extendStaticRoutes = rootOptions.$extendStaticRoutes || []
          rootOptions.$extendStaticRoutes.push(async (routes) => {
            await extendStaticRoutes.call(
              this,
              new Proxy(routes, {
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
              }),
              (...args) => {
                const pathPrefixes = ['sources', '']
                while (pathPrefixes.length) {
                  const pathPrefix = pathPrefixes.pop()
                  const path = join(staticRootGenerate, pathPrefix, ...args)
                  if (exists(path)) {
                    return importModule(path)
                  }
                }
              }
            )

            return routes
          })
        }

        // only add the routes to generate once
        if (id !== 'common') {
          return
        }

        let routes = await Promise.all(rootOptions.$generateRoutes)

        if (rootOptions.$extendStaticRoutes) {
          const routeEntries = routes.map(route => [route.route, route])
          const routesHashmap = Object.fromEntries(routeEntries)

          for (const $extendStaticRoutes of rootOptions.$extendStaticRoutes) {
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
  })

  return true
}

async function saveStaticFiles (files) {
  const staticDir = join(this.options.srcDir, this.options.dir.static)
  const pool = new PromisePool(Object.keys(files), async (file) => {
    const filePath = join(staticDir, file)
    const fileDir = dirname(filePath)
    if (!exists(fileDir)) {
      await ensureDir(fileDir)
    }
    await writeFile(filePath, files[file])
  })
  await pool.done()
}

async function saveDataSources (staticRoot, id, { topLevel, sources } = {}) {
  if (id) {
    await ensureDir(staticRoot, id)

    if (topLevel) {
      for (const topLevelKey in topLevel) {
        const topLevelPath = join(staticRoot, id, `${topLevelKey}.json`)

        await ensureDir(dirname(topLevelPath))
        await writeJson(topLevelPath, topLevel[topLevelKey])
      }
    }
  }

  if (sources) {
    const pool = new PromisePool(
      Object.values(sources),
      async (source) => {
        let sourceFile = '.json'
        if (source.path.endsWith('/')) {
          sourceFile = `index${sourceFile}`
        }

        const sourcePath = join(staticRoot, 'sources', `${source.path}`, sourceFile)
        const sourceDir = dirname(sourcePath)

        if (!exists(sourceDir)) {
          await ensureDir(sourceDir)
        }

        await writeJson(sourcePath, source)

        this.nuxt.callHook('press:source', {
          id,
          staticRoot,
          sourcePath,
          source
        })
      }
    )
    await pool.done()
  }
}

async function addTemplateAssets (context, pattern) {
  const { blueprintId, rootId, id } = context
  const srcDir = resolve('blueprints', id)
  const srcList = await walk.call(this, srcDir, pattern, true)

  const pool = new PromisePool(srcList, (src) => {
    const srcPath = resolve('blueprints', blueprintId, src)

    this.addTemplate({
      src: srcPath,
      fileName: join(rootId, 'assets', id, src.replace(`assets/`, ''))
    })
  })
  await pool.done()
}

async function addTemplates (context, templates) {
  const { blueprintId, rootId, id } = context
  const finalTemplates = {}

  for (const key in templates) {
    let template = templates[key]

    if (typeof template === 'function') {
      template = template(context)
    }

    if (typeof template === 'string') {
      if (template.startsWith('static/')) {
        continue
      }
      template = { src: template }
    }

    template.fileName = join(rootId, blueprintId, template.dest || template.src)
    template.options = context

    const [type] = key.split(':')
    if (type === 'assets') {
      await addTemplateAssets.call(this, context, template.src)
      continue
    }

    // Pick up user-provide template replacements (ie: ~/press/common/middleware.js)
    const userTemplatePath = join(this.options.srcDir, template.fileName)
    if (exists(userTemplatePath)) {
      template.src = userTemplatePath
    } else {
      template.src = join(resolve('blueprints'), blueprintId, 'templates', template.src)
    }

    // fileName should be like press/common/pages/source.vue, using Webpack alias
    finalTemplates[key] = template.fileName

    if (type === 'plugin') {
      const { dst: dest } = this.addTemplate(template)
      const pluginPath = join(this.options.buildDir, dest)

      if (id !== 'common') {
        this.options.plugins.push({
          src: pluginPath,
          ssr: template.ssr,
          mode: template.mode
        })
        continue
      }

      const httpPluginIndex = this.options.plugins
        .findIndex(p => p.src.match(/\/http\.js$/))
      this.options.plugins.splice(httpPluginIndex + 1, 0, {
        src: pluginPath,
        ssr: template.ssr,
        mode: template.mode
      })
      continue
    }

    if (type === 'layout') {
      this.addLayout(template)
      continue
    }

    // Regular Vue templates (also usable as routes)
    this.addTemplate(template)
  }

  return finalTemplates
}
