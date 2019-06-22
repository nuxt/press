import defu from 'defu'
import PromisePool from './pool'

import {
  join,
  exists,
  ensureDir,
  writeJson,
  ensureDir,
  dirname,
  writeJson,
  resolve,
  walk
} from './utils'


export async function registerBlueprints(configKey, options, blueprints) {
  for (const bp of blueprints) {
    await registerBlueprint(bp, options, configKey)
  }
}

export async function registerBlueprint(id, options = {}, configKey = null) {
  if (configKey === null) {
    configKey = id
  }

  // Load blueprint specification
  const blueprintPath = resolve(__dirname, `blueprints/${id}`)
  const blueprint = await import(blueprintPath).then(m => m.default)

  if (!blueprint.enabled.call(this, blueprint.config)) {
    return
  }
  if (!this[`$${configKey}`]) {
    this[`$${configKey}`] = {}
    this.options[configKey] = this[`$${configKey}`]
  }
  // Prefer top-level config key in nuxt.config.js
  this.options[configKey] = defu(this.options[configKey], options)
  this.options[configKey] = defu(this.options[configKey], blueprint.options)

  // Set flag to indicate blueprint was enabled
  this[`$${configKey}`][`$${id}`] = true

  // Register serverMiddleware
  for (const sm of await blueprint.serverMiddleware.call(this)) {
    this.addServerMiddleware(sm)
  }

  this.nuxt.hook('build:before', async () => {
    const pressStaticRoot = join(this.options.buildDir, 'press', 'static')

    this.options.generate.routes = () => {
      
    }
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

async function addModeAssets(mode, pattern) {
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

async function addModeTemplates(mode) {
  for (const templateKey of Object.keys(templates[mode])) {
    if (templateKey.endsWith('/assets')) {
      await addModeAssets.call(this, mode, templates[mode][templateKey])
      continue
    }
    const template = templates[mode][templateKey]
    if (!exists(this.options.srcDir, template.src)) {
      template.src = resolve('templates', template.src)
      if (templateKey.endsWith('/plugin')) {
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
}

async function addTemplates() {
  // add common

  if (this.$press.$docs) {
    await addModeTemplates.call(this, 'docs')
  }
  if (this.$press.$blog) {
    await addModeTemplates.call(this, 'blog')
  }
  if (this.$press.$slides) {
    await addModeTemplates.call(this, 'slides')
  }
}
