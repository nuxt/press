import { IgnorePlugin } from 'webpack'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import { importModule, ensureDir, exists, join, readJsonSync, remove, trimEnd } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  // Main blueprint, enabled by default
  enabled: () => true,
  templates: {
    'middleware': 'middleware.js',
    'nuxt-template': 'components/nuxt-template.js',
    'observer': 'components/observer.js',
    'plugin': 'plugin.js',
    'scroll/plugin': 'plugins/scroll.client.js',
    'source': 'pages/source.vue'
  },
  routes(templates) {
    return [
      {
        name: 'source',
        path: '/:source(.*)',
        // Final path might be under srcDir or buildDir
        // Depends on presence of user-provided template
        // And is the reason why templates is passed to this function
        component: templates.source
      }
    ]
  },
  generateRoutes(data, _, staticRoot) {
    if (!data || !data.sources) {
      return []
    }
    return Object.keys(data.sources).map(async (route) => {
      let routePath = route
      if (routePath.endsWith('/index')) {
        routePath = routePath.slice(0, route.indexOf('/index'))
      }
      if (routePath === '') {
        routePath = '/'
      }
      return {
        route: routePath,
        payload: await importModule(`${staticRoot}/sources${route}`)
      }
    })
  },
  serverMiddleware({ options, rootId, id }) {
    const { source } = options.common.api.call(this, { rootId, id })
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          const sourcePath = trimEnd(req.url.slice(12), '/')
          source.call(this, sourcePath, req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    async before() {
      if (!this.options.watch.includes('~/pages/*.md')) {
        this.options.watch.push('~/pages/*.md')
      }
      this.options.build.plugins.unshift(new IgnorePlugin(/\.md$/))
      const pagesDir = join(this.options.srcDir, this.options.dir.pages)
      if (!exists(pagesDir)) {
        this.$press.$placeholderPagesDir = pagesDir
        await ensureDir(pagesDir)
      }
    },
    async compile() {
      if (this.$press.$placeholderPagesDir) {
        await remove(this.$press.$placeholderPagesDir)
      }
    }
  },
  options: {
    api({ rootId }) {
      const rootDir = join(this.options.buildDir, rootId, 'static')
      const sourceCache = {}
      return {
        source(source, req, res, next) {
          if (!sourceCache[source]) {
            sourceCache[source] = readJsonSync(rootDir, 'sources', `${source}.json`)
          }
          res.json(sourceCache[source])
        }
      }
    },
    source: {
      processor() {
        const config = { skipToc: true, sanitize: false }
        return new Markdown(config).createProcessor()
      },
      async markdown(source, processor) {
        const { contents } = await processor.toHTML(source)
        return contents
      },
      head(source) {
        if (source.trimLeft().startsWith('---')) {
          const { content: body, data } = graymatter(source)
          return { ...data, body }
        }
        return {}
      },
      title(body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
