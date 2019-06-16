
import { dirname } from 'path'
import { readdirSync } from 'fs'
import { IgnorePlugin } from 'webpack'
import defu from 'defu'
import { writeJson, ensureDir, remove } from 'fs-extra'
import defaults from './defaults'
import PromisePool from './pool'

import { resolve, join, exists, writeFile } from './utils'

import * as routes from './routes'
import * as api from './api'
import * as templates from './templates'

import loadData from './loaders'

function loadOptions(options) {
  // Prefer top-level press config key in nuxt.config.js
  options = defu(this.options.press, options)
  // Ensure all option defaults are picked up
  options = defu(options, defaults)
  // Easy config access in helper functions
  this.$press = options

  // Enable docs if srcDir/*.md files exists
  // or if the srcDir/docs/ folder exists
  if (
    readdirSync(this.options.srcDir).find(p => /\.md$/.test(p)) ||
    exists(this.options.srcDir, this.$press.docs.dir)
  ) {
    this.$press.$docs = true
  }

  // Enable blog if srcDir/blog/ exists
  const blogDir = join(this.options.srcDir, this.$press.blog.dir)
  if (exists(blogDir)) {
    this.$press.$blog = true
  }

  // Enable slides if srcDir/slides/ exists
  const slidesDir = join(this.options.srcDir, this.$press.slides.dir)
  if (exists(slidesDir)) {
    this.$press.$slides = true
  }
}

async function ensureNuxtPages() {
  const pagesDir = join(this.options.srcDir, this.options.dir.pages)
  if (!exists(pagesDir)) {
    this.$press.$placeholderPagesDir = pagesDir
    await ensureDir(pagesDir)
  }
}

async function ensureNuxtPressJson(pressJson) {
  const pressJsonPath = join(this.options.srcDir, 'nuxt.press.json')
  if (!exists(pressJsonPath)) {
    await writeJson(pressJsonPath, pressJson, { spaces: 2 })
  }
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
    nuxtRoutes.splice(0, nuxtRoutes.length, ...modeRoutes)
  })
}

function registerGenerateRoutes(data) {
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

async function saveStaticData(staticRoot, data) {
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

function setupDocsAPI() {
  let indexHandler

  const configAPI = this.$press.docs.api
  if (configAPI.index) {
    indexHandler = configAPI.index
  } else {
    indexHandler = api.docs(this.options.buildDir).index
  }
  this.addServerMiddleware((req, res, next) => {
    if (req.url.startsWith('/api/docs/index')) {
      indexHandler(req, res, next)
    } else {
      next()
    }
  })
}

function setupBlogAPI() {
  let indexHandler
  let archiveHandler

  const configAPI = this.$press.blog.api
  if (configAPI.index && configAPI.archive) {
    indexHandler = configAPI.index
    archiveHandler = configAPI.archive
  } else {
    const blogAPI = api.blog(this.options.buildDir)
    indexHandler = blogAPI.index
    archiveHandler = blogAPI.archive
  }
  this.addServerMiddleware((req, res, next) => {
    if (req.url.startsWith('/api/blog/index')) {
      indexHandler(req, res, next)
    } else if (req.url.startsWith('/api/blog/archive')) {
      archiveHandler(req, res, next)
    } else {
      next()
    }
  })
}

function setupSlidesAPI() {
  let indexHandler

  const configAPI = this.$press.slides.api
  if (configAPI.index) {
    indexHandler = configAPI.index
  } else {
    indexHandler = api.slides(this.options.buildDir).index
  }
  this.addServerMiddleware((req, res, next) => {
    if (req.url.startsWith('/api/slides/index')) {
      indexHandler(req, res, next)
    } else {
      next()
    }
  })
}

function setupAPI() {
  const sourceHandler = this.$press.api.source ||
    api.source(this.options.buildDir)
  this.addServerMiddleware(api.base)
  this.addServerMiddleware((req, res, next) => {
    if (req.url.startsWith('/api/source/')) {
      sourceHandler(req, res, next)
    } else {
      next()
    }
  })
  if (this.$press.$docs) {
    setupDocsAPI.call(this)
  }
  if (this.$press.$blog) {
    setupBlogAPI.call(this)
  }
  if (this.$press.$slides) {
    setupSlidesAPI.call(this)
  }
}

function addModeTemplates(mode) {
  for (const templateKey of Object.keys(templates[mode])) {
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

export default function (options) {
  // Automatically register modules
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  // TODO @Atinux
  // this.requireModule('@nuxtjs/tailwindcss')
  //
  // Need to think this through, don't want to add
  // a tailwind.config.js file unless we really need it.
  // It seems a default file is added to srcDir no matter what.
  //
  // I'm wrapping up some base themes with vanila CSS for now
  // and will leave the Tailwindsurfing to you ;)
  //

  this.options.build.postcss.preset.stage = 0
  this.options.css.push('prismjs/themes/prism.css')
  this.options.watch.push(
    '~/*.md',
    '~/docs/*.md',
    '~/blog/*.md',
    '~/blog/**/*.md',
    '~/slides/*.md'
  )
  loadOptions.call(this, options)
  setupAPI.call(this)

  this.nuxt.hook('build:before', async () => {
    await ensureNuxtPages.call(this)
    await addTemplates.call(this)
    registerRoutes.call(this)

    const data = await loadData.call(this)
    // console.log('data', data)
    // process.exit()

    // TODO fix
    // if (this.$press.blog && !this.$press.index) {
    //   generateFeeds.call(this, index)
    // }

    this.options.build.plugins.unshift(new IgnorePlugin(/\.md$/))

    this.nuxt.hook('build:compile', async () => {
      const staticRoot = join(this.options.buildDir, 'press', 'static')
      await saveStaticData.call(this, staticRoot, data)

      if (this.$press.$docs) {
        await ensureNuxtPressJson.call(this, {
          toc: Object.keys(data.docs.topLevel.index)
        })
      }

      if (this.$press.$placeholderPagesDir) {
        await remove(this.$press.$placeholderPagesDir)
      }

      this.nuxt.hook('generate:distCopied', async () => {
        const staticRootGenerate = join(this.options.generate.dir, 'press')
        await ensureDir(staticRootGenerate)
        await saveStaticData.call(this, staticRootGenerate, data)
      })

      registerGenerateRoutes.call(this)
    })
  })
}
