import { join, exists } from './utils'

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

export function registerGenerateRoutes(data) {
  const pressStaticRoot = join(this.options.buildDir, 'press', 'static')

  this.options.generate.routes = () => {
    const genRoutes = []
    if (this.$press.$docs) {
      for (const topLevelRoute of Object.keys(data.blog.topLevel)) {
        genRoutes.push({
          route: `${this.$press.docs.prefix}${topLevelRoute}`,
          payload: require(`${pressStaticRoot}/docs/${topLevelRoute}.json`)
        })
      }
    }
    if (this.$press.blog) {
      for (const topLevelRoute of Object.keys(data.blog.topLevel)) {
        genRoutes.push({
          route: `${this.$press.blog.prefix}${topLevelRoute}`,
          payload: require(`${pressStaticRoot}/blog/${topLevelRoute}.json`)
        })
      }
    }
    if (this.$press.slides) {
      for (const topLevelRoute of Object.keys(data.slides.topLevel)) {
        genRoutes.push({
          route: `${this.$press.slides.prefix}${topLevelRoute}`,
          payload: require(`${pressStaticRoot}/slides/${topLevelRoute}.json`)
        })
      }
    }
    genRoutes.push(
      Object.keys({
        ...this.$press.$docs && data.docs.sources,
        ...this.$press.$blog && data.blog.sources,
        ...this.$press.$slides && data.slides.sources
      }).map((route) => {
        return {
          route,
          payload: require(`${pressStaticRoot}/sources${route}`)
        }
      })
    )
    return genRoutes
  }
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
  this.addPlugin({
    src: resolve('templates/plugin.js'),
    fileName: 'press/plugin.js',
    options: this.$press
  })

  this.addTemplate({
    src: resolve('templates/components/nuxt-template.js'),
    fileName: 'press/components/nuxt-template.js',
    options: this.$press
  })

  this.addPlugin({
    src: resolve('templates/source.vue'),
    fileName: 'press/pages/source.vue',
    options: this.$press
  })

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