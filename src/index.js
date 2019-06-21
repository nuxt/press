
import { IgnorePlugin } from 'webpack'
import defu from 'defu'
import blueprint from './blueprint'
import PromisePool from './pool'

import {
  walk,
  dirname,
  readdirSync,
  readFileSync,
  resolve,
  join,
  exists,
  writeFile,
  writeJson,
  ensureDir,
  remove,
  move
} from './utils'

import {
  common,
  docs,
  blog,
  slides
} from './bluprints'

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

export default function (options) {
  // Automatically register modules
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  })

  this.extendBuild((config) => {
    config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
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
