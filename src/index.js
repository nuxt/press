
import defu from 'defu'
import { IgnorePlugin } from 'webpack'
import { registerBlueprints } from './blueprint'

import {
  ensureDir,
  exists,
  join,
  move,
  readdirSync,
  remove,
  resolve,
  writeFile,
  writeJson
} from './utils'

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

  // Load and register blueprints from './blueprints',
  // where the first argument is the top-level Nuxt configuration key
  // and the second argument is the loading order of blueprints
  registerBlueprints('press', ['common', 'docs', 'blog', 'slides'])

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
  // setupAPI.call(this)

  this.nuxt.hook('build:before', async () => {
    await ensureNuxtPages.call(this)
    // await addTemplates.call(this)
    // registerRoutes.call(this)

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
