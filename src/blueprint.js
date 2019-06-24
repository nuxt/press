import defu from 'defu'
import PromisePool from './pool'

import {
  dirname,
  join,
  ensureDir,
  exists,
  writeJson,
  resolve,
  walk
} from './utils'

export async function registerBlueprints(rootId, options, blueprints) {
  // rootId: root id (used to define directory and config key)
  // options: module options (as captured by the module function)
  // blueprints: blueprint loading order
  for (const bp of blueprints) { // ['slides', 'common']) {
    await _registerBlueprint.call(this, bp, rootId, options)
  }
}

// TODO
// possible enhancement if released as a standalone library:
// refactor to allow registering a single, top-level blueprint
export async function _registerBlueprint(id, rootId, options = {}) {
  // Load blueprint specification
  const blueprintPath = resolve(`blueprints/${id}`)
  const blueprint = await import(blueprintPath).then(m => m.default)

  // Return if blueprint is not enabled
  if (!blueprint.enabled.call(this, blueprint.options)) {
    return
  }

  // Set global configKey if unset
  if (!this[`$${rootId}`]) {
    this[`$${rootId}`] = {}
  }

  // Prefer top-level config key in nuxt.config.js
  Object.assign(
    this[`$${rootId}`],
    defu(this.options[`$${rootId}`], options)
  )
  if (!this[`$${rootId}`][id]) {
    this[`$${rootId}`][id] = {}
  }
  Object.assign(
    this[`$${rootId}`],
    defu(this[`$${rootId}`], { [id]: blueprint.options })
  )

  // Set flag to indicate blueprint was enabled
  this[`$${rootId}`][`$${id}`] = true

  // For easy config acess in helper functions
  options = this[`$${rootId}`]

  // Register serverMiddleware
  for (const sm of await blueprint.serverMiddleware.call(this, options)) {
    this.addServerMiddleware(sm)
  }

  this.nuxt.hook('build:before', async () => {
    const context = { options, rootId, id }
    const templates = await addTemplates.call(this, context, blueprint.templates)

    context.data = await blueprint.data.call(this)

    if (blueprint.hooks && blueprint.hooks.beforeBuild) {
      await blueprint.hooks.beforeBuild.call(this, context)
    }

    if (blueprint.routes) {
      const routes = await blueprint.routes.call(this, templates)
      this.extendRoutes((nuxtRoutes, resolve) => {
        for (const route of routes) {
          if (exists(join(this.options.srcDir, route.component))) {
            route.component = join('~', route.component)
          } else {
            route.component = join(this.options.buildDir, route.component)
          }
        }
        nuxtRoutes.push(...routes)
      })
    }

    this.nuxt.hook('build:compile', async () => {
      const staticRoot = join(this.options.buildDir, rootId, 'static')
      await saveStaticData.call(this, staticRoot, id, context.data)

      if (blueprint.hooks && blueprint.hooks.compileBuild) {
        await blueprint.hooks.compileBuild.call(this, context)
      }

      if (blueprint.generateRoutes) {
        const pathPrefix = path => `${blueprint.options.prefix}${path}`
        const generateRoutes = await blueprint.generateRoutes.call(this, context.data, pathPrefix, staticRoot)
        this.options.generate.routes.push(...generateRoutes)
      }

      this.nuxt.hook('generate:distCopied', async () => {
        const staticRootGenerate = join(this.options.generate.dir, rootId)
        await ensureDir(staticRootGenerate)
        await saveStaticData.call(this, staticRootGenerate, id, context.data)
      })
    })
  })
}

async function saveStaticData(staticRoot, id, data) {
  await ensureDir(join(staticRoot, id))
  const { topLevel, sources } = data
  if (topLevel) {
    for (const topLevelKey of Object.keys(topLevel)) {
      await writeJson(join(staticRoot, id, `${topLevelKey}.json`), topLevel[topLevelKey])
    }
  }
  if (sources) {
    const pool = new PromisePool(
      Object.values(sources),
      async (source) => {
        const sourcePath = join(staticRoot, 'sources', `${source.path}.json`)
        await ensureDir(dirname(sourcePath))
        await writeJson(sourcePath, source)
      }
    )
    await pool.done()
  }
}

async function addTemplateAssets({ options, rootId, id }, pattern) {
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

async function addTemplates({ options, rootId, id }, templates) {
  const finalTemplates = {}
  const sliceAt = resolve('blueprints').length + 1
  for (const templateKey of Object.keys(templates)) {
    if (templateKey === 'assets') {
      await addTemplateAssets.call(this, { options, rootId, id }, templates[templateKey])
      continue
    }
    const templateSpec = templates[templateKey]
    const isTemplateArr = Array.isArray(templateSpec)
    const template = {
      src: isTemplateArr ? templateSpec[0] : templateSpec,
      ...isTemplateArr && templateSpec[1]
    }

    // Pick up user-provide template replacements
    const userProvidedTemplate = join(this.options.srcDir, rootId, id, template.src)
    if (exists(userProvidedTemplate)) {
      template.src = userProvidedTemplate
    } else {
      template.src = resolve('blueprints', id, template.src)
    }

    template.fileName = join(rootId, template.src.slice(sliceAt))
    finalTemplates[templateKey] = template.fileName

    if (templateKey === 'plugin' || templateKey.endsWith('/plugin')) {
      this.addPlugin({ ...template, options })
      continue
    }

    if (templateKey === 'layout' || templateKey.endsWith('/layout')) {
      this.addLayout({ ...template, options }, id)
      continue
    }

    // Regular Vue templates (also usable as routes)
    this.addTemplate({ ...template, options })
  }
  // console.log('finalTemplates', finalTemplates)
  // process.exit()

  return finalTemplates
}
