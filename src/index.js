
import { dirname } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { IgnorePlugin } from 'webpack'
import defu from 'defu'
import { writeJson, ensureDir, remove, move } from 'fs-extra'
import defaults from './defaults'
import PromisePool from './pool'

import { walk, resolve, join, exists, writeFile } from './utils'

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

export default function (options) {
  // Automatically register modules
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  this.extendBuild((config) => {
    config.resolve.alias['vue$'] = 'vue/dist/vue.esm.js'
  })

  this.options.build.postcss.preset.stage = 0
  this.options.css.push(
    'prismjs/themes/prism.css',
    resolve('themes/default.css')
  )
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
