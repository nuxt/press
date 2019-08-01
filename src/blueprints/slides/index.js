import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import { importModule, exists, join, readJsonSync } from '../../utils'
import data, { parseSlides } from './data'

export default {
  // Include data loader
  data,
  // Enable slides blueprint if srcDir/slides/*.md files exist
  enabled (options) {
    if (options.$standalone === 'slides') {
      options.slides.prefix = '/'
      if (!exists(join(this.options.srcDir, options.slides.dir))) {
        options.slides.dir = ''
      }
      return true
    }
    return exists(join(this.options.srcDir, options.slides.dir))
  },
  templates: {
    index: 'pages/index.vue',
    layout: 'layouts/slides.vue',
    plugin: 'plugins/slides.client.js',
    slides: 'components/slides.vue',
    arrowLeft: 'assets/arrow-left.svg',
    arrowRight: 'assets/arrow-right.svg'
  },
  // Register routes once templates have been added
  routes (templates) {
    return [
      {
        name: 'slides_index',
        path: this.$press.slides.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes (data, prefix, staticRoot) {
    return Object.keys(data.sources).map(async route => ({
      route: prefix(route),
      payload: await importModule(`${staticRoot}/sources${route}`)
    }))
  },
  // Register serverMiddleware
  serverMiddleware ({ options, rootId, id }) {
    const { index } = typeof options.slides.api === 'function'
      ? options.slides.api.call(this, { rootId, id })
      : options.slides.api
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/slides/index')) {
          index(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    before () {
      this.$addPressTheme('blueprints/slides/theme.css')
    },
    async done () {
      if (this.$isGenerate) {
        return
      }
      let updatedSlides
      const mdProcessor = await this.$press.slides.source.processor()
      const watchDir = this.$press.slides.dir
        ? `${this.$press.slides.dir}/`
        : this.$press.slides.dir
      chokidar.watch([`${watchDir}*.md`, `${watchDir}**/*.md`], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
        .on('change', async (path) => {
          updatedSlides = await parseSlides.call(this, path, mdProcessor)
          this.$pressSourceEvent('change', 'slides', updatedSlides)
        })
        .on('add', async (path) => {
          updatedSlides = await parseSlides.call(this, path, mdProcessor)
          this.$pressSourceEvent('add', 'slides', updatedSlides)
        })
        .on('unlink', path => this.$pressSourceEvent('unlink', 'slides', { path }))
    }
  },
  // Options are merged into the parent module default options
  options: {
    dir: 'slides',
    prefix: '/slides/',
    api ({ rootId }) {
      const cache = {}
      const rootDir = join(this.options.buildDir, rootId, 'static')
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'slides', 'index.json')
          }
          res.json(cache.index)
        }
      }
    },
    source: {
      processor () {
        const config = { skipToc: true, sanitize: false }
        return new Markdown(config).createProcessor()
      },
      async markdown (source, processor) {
        const { contents } = await processor.toHTML(source)
        return contents
      },
      metadata (source) {
        if (source.trimLeft().startsWith('---')) {
          const { content: body, data } = graymatter(source)
          return { ...data, body }
        }
        return {}
      },
      path (fileName) {
        return `${this.$press.slides.prefix}${fileName.toLowerCase()}`
      }
    }
  }
}
