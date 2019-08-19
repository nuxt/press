import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import {
  importModule,
  exists,
  join,
  readJsonSync,
  routePath,
  trimSlash
} from '../../utils'
import data, { parseSlides } from './data'

export default {
  // Include data loader
  data,
  // Enable slides blueprint if srcDir/slides/*.md files exist
  enabled ({ rootOptions, options }) {
    if (rootOptions.$standalone === 'slides') {
      options.prefix = '/'
      if (!exists(join(this.options.srcDir, options.dir))) {
        options.dir = ''
      }
      return true
    }
    return exists(join(this.options.srcDir, options.dir))
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
  routes ({ options }, templates) {
    return [
      {
        name: 'slides_index',
        path: options.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes ({ blueprintId, data }, prefix, staticRoot) {
    return [
      ...Object.keys(data.topLevel).map(async route => ({
        route: prefix(routePath(route)),
        payload: await importModule(join(staticRoot, blueprintId, `${trimSlash(route)}.json`))
      })),
      ...Object.keys(data.sources).map(async route => ({
        route: prefix(route),
        payload: await importModule(join(staticRoot, 'sources', route))
      }))
    ]
  },
  // Register serverMiddleware
  serverMiddleware ({ options, rootId, id }) {
    const { index } = typeof options.api === 'function'
      ? options.api.call(this, { rootId, id })
      : options.api
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
    async done (context) {
      if (!this.nuxt.options.dev) {
        return
      }

      const { options } = context

      let updatedSlides
      const mdProcessor = await options.source.processor()
      const watchDir = options.dir
        ? `${options.dir}/`
        : options.dir
      const watcher = chokidar.watch([`${watchDir}*.md`, `${watchDir}**/*.md`], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
      watcher.on('change', async (path) => {
        updatedSlides = await parseSlides.call(this, context, path, mdProcessor)
        this.$pressSourceEvent('change', 'slides', updatedSlides)
      })
      watcher.on('add', async (path) => {
        updatedSlides = await parseSlides.call(this, context, path, mdProcessor)
        this.$pressSourceEvent('add', 'slides', updatedSlides)
      })
      watcher.on('unlink', path => this.$pressSourceEvent('unlink', 'slides', { path }))
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
        return fileName.toLowerCase()
      }
    }
  }
}
