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
  for (const bp of blueprints) {
    await _registerBlueprint(bp, rootId, options)
  }
}

// TODO
// possible enhancement if released as a standalone library:
// refactor to allow registering a single, top-level blueprint
export async function _registerBlueprint(id, rootId, options = {}) {
  // Load blueprint specification
  const blueprintPath = resolve(__dirname, `blueprints/${id}`)
  const blueprint = await import(blueprintPath).then(m => m.default)

  // Return if blueprint is not enabled
  if (!blueprint.enabled.call(this, blueprint.config)) {
    return
  }

  // Set global configKey if not set yet
  if (!this[`$${rootId}`]) {
    this[`$${rootId}`] = {}
    this.options[`$${rootId}`] = this[`$${rootId}`]
  }

  // Prefer top-level config key in nuxt.config.js
  this.options[`$${rootId}`] = defu(this.options[`$${rootId}`], options)
  this.options[`$${rootId}`] = defu(this.options[`$${rootId}`], blueprint.options)

  // Set flag to indicate blueprint was enabled
  this[`$${rootId}`][`$${id}`] = true

  // For easy config acess in helper functions
  options = this.options[`$${rootId}`]

  if (!options.$routes) {
    options.$routes = []
    options.$generateRoutes = []
  }

  // Register serverMiddleware
  for (const sm of await blueprint.serverMiddleware.call(this)) {
    this.addServerMiddleware(sm)
  }

  this.nuxt.hook('build:before', async () => {
    const context = { options, rootId, id }
    const templates = await addTemplates.call(this, context, blueprint.templates)

    context.data = await blueprint.data.call(this)

    if (blueprint.hooks && blueprint.hooks.beforeBuild) {
      await blueprint.hooks.beforeBuild.call(this, context)
    }

    this.extendRoutes(async (nuxtRoutes) => {
      nuxtRoutes.push(...await blueprint.routes.call(this, templates))
    })
    this.options.generate.routes.push(...await blueprint.generateRoutes.call(this))

    this.nuxt.hook('build:compile', async () => {
      const staticRoot = join(this.options.buildDir, rootId, 'static')
      await saveStaticData.call(this, staticRoot, context.data)
      this.nuxt.hook('generate:distCopied', async () => {
        const staticRootGenerate = join(this.options.generate.dir, rootId)
        await ensureDir(staticRootGenerate)
        await saveStaticData.call(this, staticRootGenerate, context.data)
      })
    })
  })
}

async function saveStaticData(staticRoot, id, data) {
  await ensureDir(join(staticRoot, key))
  const { topLevel, sources } = data[key]
  for (const topLevelKey of Object.keys(topLevel)) {
    await writeJson(join(staticRoot, key, `${topLevelKey}.json`), topLevel[topLevelKey])
  }
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

async function addTemplateAssets(mode, pattern) {
  const srcDir = resolve('templates', mode)
  // const assetBasePath = `press/assets/${mode}/`
  const srcList = await walk.call(this, srcDir, pattern, true)
  // const srcStreams = {}
  const pool = new PromisePool(srcList, async (src) => {
    const srcPath = resolve('templates', mode, src)
    this.addTemplate({
      src: srcPath,
      fileName: join('press', 'assets', mode, src.replace(`assets/`, ''))
    })
  })
  await pool.done()
}

async function addTemplates(options, rootId, id, templates) {
  const finalTemplates = {}
  for (const templateKey of Object.keys(templates)) {
    if (templateKey === 'assets') {
      await addTemplateAssets.call(this, options, rootId, id, templates[templateKey])
      continue
    }
    const templateSpec = templates[templateKey]
    const isTemplateArr = Array.isArray(templateSpec)
    const template = {
      src: isTemplateArr ? templateSpec[0] : templateSpec,
      ...isTemplateArr && templateSpec[1]
    }
    const userProvidedTemplate = join(this.options.srcDir, rootId, id, template.src)
    if (exists(userProvidedTemplate)) {
      template.src = userProvidedTemplate
    } else {
      template.src = resolve('blueprints', id, template.src)
    }
    if (templateKey === 'plugin' || templateKey.endsWith('/plugin')) {
      template.fileName = join(rootId, id, template.src)
      this.addPlugin({ ...template, options })
      continue
    }
    if (templateKey === 'layout' || templateKey.endsWith('/layout')) {
      template.fileName = join(rootId, id, template.src)
      this.addLayout({ ...template, options }, mode)
      continue
    }
    template.fileName = join(rootId, id, template.src)
    this.addTemplate({ ...template, options })
    finalTemplates[templateKey] = template.fileName
  }
  return finalTemplates
}
