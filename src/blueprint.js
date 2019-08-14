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

export async function registerBlueprints (rootId, options, blueprintIds) {
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

  for (const id of blueprintIds) {
    await _registerBlueprint.call(this, id, rootId, options)
  }
}

export async function _registerBlueprint (id, rootId, options) {
  // Load blueprint specification
  const blueprint = await blueprints[id]()

  // Populate mode default options
  const blueprintOptions = defu(options[id] || {}, blueprint.options)

  // Determine if mode is enabled
  if (!blueprint.enabled.call(this, { ...options, [id]: blueprintOptions })) {
    // Return if blueprint is not enabled
    return
  }

  // Set flag to indicate blueprint was enabled (ie: options.$common = true)
  options[`$${id}`] = true
  if (this.options.dev) {
    options.dev = true
  }

  // Populate options with defaults
  options[id] = blueprintOptions

  // Register server middleware
  if (blueprint.serverMiddleware) {
    for (let serverMiddleware of await blueprint.serverMiddleware.call(this, { options, rootId, id })) {
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
    await blueprint.ready.call(this)
  }

  const context = { options, rootId, id, data: undefined }

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

        if (data.options) {
          Object.assign(options[id], data.options)
        }

        if (data.static) {
          if (typeof options[id].extendStaticFiles === 'function') {
            await options[id].extendStaticFiles.call(this, data.static, context)
          }
          await saveStaticFiles.call(this, data.static)
        }

        const templates = await addTemplates.call(this, context, blueprint.templates)

        await updateConfig.call(this, rootId, { [id]: data.options })

        if (blueprint.routes) {
          const routes = await blueprint.routes.call(this, templates)

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

  if (this.$isGenerate) {
    let staticRootGenerate

    this.nuxt.addHooks({
      generate: {
        // generate:distCopied hook
        distCopied: async () => {
          staticRootGenerate = join(this.options.generate.dir, `_${rootId}`)

          await ensureDir(staticRootGenerate)
          await saveDataSources.call(this, staticRootGenerate, id, context.data)

          if (blueprint.generateRoutes) {
            options.$generateRoutes = options.$generateRoutes || []

            const prefixPath = path => `${options[id].prefix}${path}`
            const routes = await blueprint.generateRoutes.call(
              this,
              context.data,
              prefixPath,
              staticRootGenerate
            )

            if (!Array.isArray(routes)) {
              options.$generateRoutes.push(routes)
              return
            }

            options.$generateRoutes.push(...routes)
          }
        },
        // generate:extendRoutes hook
        extendRoutes: async (extendRoutes) => {
          const { extendStaticRoutes } = options[id]

          if (extendStaticRoutes) {
            options.$extendStaticRoutes = options.$extendStaticRoutes || []
            options.$extendStaticRoutes.push(async (routes) => {
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
                  return importModule(join(staticRootGenerate, 'sources', ...args))
                }
              )

              return routes
            })
          }

          // only add the routes to generate once
          if (id !== 'common') {
            return
          }

          let routes = await Promise.all(options.$generateRoutes)

          if (options.$extendStaticRoutes) {
            const routeEntries = routes.map(route => [route.route, route])
            const routesHashmap = Object.fromEntries(routeEntries)

            for (const $extendStaticRoutes of options.$extendStaticRoutes) {
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
  }
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

async function addTemplateAssets ({ options, rootId, id }, pattern) {
  const srcDir = resolve('blueprints', id)
  const srcList = await walk.call(this, srcDir, pattern, true)

  const pool = new PromisePool(srcList, (src) => {
    const srcPath = resolve('blueprints', id, src)

    this.addTemplate({
      src: srcPath,
      fileName: join(rootId, 'assets', id, src.replace(`assets/`, ''))
    })
  })
  await pool.done()
}

async function addTemplates ({ options, rootId, id }, templates) {
  const finalTemplates = {}

  for (const key in templates) {
    const type = key.split(':')[0]
    let template = templates[key]
    if (typeof template === 'string') {
      if (template.startsWith('static/')) {
        continue
      }
      template = { src: template }
    }
    template.fileName = join(rootId, id, template.src)
    template.options = options

    if (type === 'assets') {
      await addTemplateAssets.call(this, { options, rootId, id }, template.src)
      continue
    }

    // Pick up user-provide template replacements (ie: ~/press/common/middleware.js)
    const userTemplatePath = join(this.options.srcDir, template.fileName)
    if (exists(userTemplatePath)) {
      template.src = userTemplatePath
    } else {
      template.src = join(resolve('blueprints'), id, 'templates', template.src)
    }

    // fileName should be like press/common/pages/source.vue, using Webpack alias
    finalTemplates[key] = template.fileName

    if (type === 'plugin') {
      const { dst } = this.addTemplate({ ...template, options })

      if (id !== 'common') {
        this.options.plugins.push({
          src: join(this.options.buildDir, dst),
          ssr: template.ssr,
          mode: template.mode
        })
        continue
      } else {
        const httpPluginIndex = this.options.plugins
          .findIndex(p => p.src.match(/\/http\.js$/))
        this.options.plugins.splice(httpPluginIndex + 1, 0, {
          src: join(this.options.buildDir, dst),
          ssr: template.ssr,
          mode: template.mode
        })
        continue
      }
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
