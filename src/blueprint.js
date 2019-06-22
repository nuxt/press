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

export async function registerBlueprints(configKey, options, blueprints) {
  for (const bp of blueprints) {
    await registerBlueprint(bp, options, configKey)
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
  const config = this.options[`$${rootId}`]

  // Register serverMiddleware
  for (const sm of await blueprint.serverMiddleware.call(this)) {
    this.addServerMiddleware(sm)
  }

  this.nuxt.hook('build:before', async () => {
    const templates = await addTemplates.call(this, config, rootId, id, blueprint.templates)
    // const pressStaticRoot = join(this.options.buildDir, 'press', 'static')

    this.options.generate.routes = async () => {
    }
  })
}

function normalize(routes) {
  for (const route of routes) {
    if (exists(join(this.options.srcDir, route.component))) {
      route.component = `~${route.component}`
    } else {
      route.component = join(this.options.buildDir, 'press', route.component)
    }
  }
  return routes
}

function registerRoutes() {
  this.extendRoutes((nuxtRoutes, resolve) => {
    const modeRoutes = []
    if (this.$press.$docs) {
      modeRoutes.push(...routes.docs.call(this))
    }
    if (this.$press.$blog) {
      modeRoutes.push(...routes.blog.call(this))
    }
    if (this.$press.$slides) {
      modeRoutes.push(...routes.slides.call(this))
    }
    modeRoutes.push(...routes.common.call(this))
    nuxtRoutes.unshift(...modeRoutes)
  })
}

export async function saveStaticData(staticRoot, data) {
  for (const key of Object.keys(data)) {
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

async function addTemplates(config, rootId, id, templates) {
  for (const templateKey of Object.keys(templates)) {
    if (templateKey === 'assets') {
      await addTemplateAssets.call(this, mode, templates[templateKey])
      continue
    }
    const templateSpec = templates[templateKey]
    const isTemplateArr = Array.isArray(templateSpec)
    const template = {
      src: isTemplateArr ? templateSpec[0] : templateSpec,
      ...isTemplateArr && templateSpec[1]
    }
    const userProvidedTemplate = join(this.options.srcDir, id, template.src)
    if (exists(userProvidedTemplate)) {
      template.src = userProvidedTemplate
    } else {
      template.src = resolve('blueprints', id, template.src)
    }
    if (templateKey === 'plugin' || templateKey.endsWith('/plugin')) {
      template.fileName = join('press', template.fileName)
      this.addPlugin({ ...template, options: this.$press })
      continue
    }
    if (templateKey.endsWith('/layout')) {
      template.fileName = join('press', template.fileName)
      this.addLayout({ ...template, options: this.$press }, mode)
      continue
    }
    template.fileName = join('press', template.fileName)
    this.addTemplate({ ...template, options: this.$press })
  }
}
