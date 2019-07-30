import defu from 'defu'
import PromisePool from './pool'
import resolve from './resolve'

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

import docs from './blueprints/docs'
import blog from './blueprints/blog'
import slides from './blueprints/slides'
import common from './blueprints/common'

const blueprints = { docs, blog, slides, common }

export async function registerBlueprints (rootId, options, blueprints) {
  // this: Nuxt ModuleContainer instance
  // rootId: root id (used to define directory and config key)
  // options: module options (as captured by the module function)
  // blueprints: blueprint loading order

  // Sets this.options[rootId] ensuring
  // external config files have precendence
  options = await loadConfig.call(this, rootId, options)

  const devStaticRoot = join(this.options.buildDir, rootId, 'static')
  this.saveDevDataSources = (...args) => {
    return new Promise(async (resolve) => {
      await saveDataSources.call(this, devStaticRoot, ...args)
      resolve()
    })
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

  for (const id of blueprints) { // ['slides', 'common']) {
    await _registerBlueprint.call(this, id, rootId, options)
  }

  // Future-compatible flag
  this.$isGenerate = this._generate || this.target === 'static'
}

export async function _registerBlueprint (id, rootId, options) {
  // Load blueprint specification
  const blueprint = blueprints[id]

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
    for (let sm of await blueprint.serverMiddleware.call(this, { options, rootId, id })) {
      sm = sm.bind(this)
      this.addServerMiddleware(async (req, res, next) => {
        try {
          await sm(req, res, next)
        } catch (err) {
          next(err)
        }
      })
    }
  }

  this.nuxt.hook('build:before', async () => {
    const context = { options, rootId, id }

    context.data = await blueprint.data.call(this, context)

    if (context.data.options) {
      Object.assign(options[id], context.data.options)
    }

    if (context.data.static) {
      if (typeof options[id].extendStaticFiles === 'function') {
        await options[id].extendStaticFiles.call(this, context.data.static, context)
      }
      await saveStaticFiles.call(this, context.data.static)
    }

    const templates = await addTemplates.call(this, context, blueprint.templates)

    await updateConfig.call(this, rootId, { [id]: context.data.options })

    if (blueprint.build && blueprint.build.before) {
      await blueprint.build.before.call(this, context)
    }

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

    const staticRoot = join(this.options.buildDir, rootId, 'static')
    await saveDataSources.call(this, staticRoot, id, context.data)

    this.nuxt.hook('build:compile', async () => {
      const staticRoot = join(this.options.buildDir, rootId, 'static')
      const staticRootGenerate = join(this.options.generate.dir, `_${rootId}`)
      await saveDataSources.call(this, staticRoot, id, context.data)

      if (blueprint.build) {
        this.nuxt.hook('build:done', async () => {
          if (blueprint.build.done) {
            await blueprint.build.done.call(this, context)
            console.log('this.options.css', this.options.css)
          }

          if (blueprint.generateRoutes) {
            if (!options.$generateRoutes) {
              options.$generateRoutes = []
            }
            const pathPrefix = path => `${options[id].prefix}${path}`
            options.$generateRoutes.push(async () => {
              const routes = await blueprint.generateRoutes.call(
                this,
                context.data,
                pathPrefix,
                staticRootGenerate
              )

              if (Array.isArray(routes)) {
                return Promise.all(routes)
              }

              return routes
            })
          }

          // TODO move this out of the build:done hook
          // and onto a global (after all blueprints
          // build:done hooks finished) handler
          if (options.$generateRoutes) {
            const { extendStaticRoutes } = options
            this.options.generate.routes = async () => {
              const routes = {}
              const routeSets = await Promise.all(
                options.$generateRoutes.map(route => route())
              )
              for (const routeSet of routeSets) {
                for (const route of routeSet) {
                  routes[route.route] = route
                }
              }
              if (extendStaticRoutes) {
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
                    return importModule(join(staticRootGenerate, ...args))
                  }
                )
              }
              return Object.values(routes)
            }
          }
        })
      }

      if (blueprint.build && blueprint.build.compile) {
        await blueprint.build.compile.call(this, context)
      }

      this.nuxt.hook('generate:distCopied', async () => {
        await ensureDir(staticRootGenerate)
        await saveDataSources(staticRootGenerate, id, context.data)
      })
    })
  })
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
        const sourcePath = join(staticRoot, 'sources', `${source.path}.json`)
        const sourceDir = dirname(sourcePath)

        if (!exists(sourceDir)) {
          await ensureDir(sourceDir)
        }

        await writeJson(sourcePath, source)
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

      // Push plugin at the end
      this.options.plugins.push({
        src: join(this.options.buildDir, dst),
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
