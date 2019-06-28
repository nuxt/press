import { IgnorePlugin } from 'webpack'
import Markdown from '@nuxt/markdown'
import { _import, ensureDir, exists, join, readJsonSync, remove } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  // Main blueprint, enabled by default
  enabled: () => true,
  templates: {
    'middleware': 'middleware.js',
    'plugin': 'plugin.js',
    'scroll/plugin': ['plugins/scroll.js', { ssr: false }],
    'observer': 'components/observer.js',
    'nuxt-template': 'components/nuxt-template.js',
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
        payload: await _import(`${staticRoot}/sources${route}`)
      }
    })
  },
  serverMiddleware({ options, rootId, id }) {
    const { source } = options.common.api.call(this, { rootId, id })
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          source.call(this, req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    async before() {
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
    },
    done() {
      this.options.watch.push('~/pages/*.md')
    }
  },
  options: {
    api({ rootId }) {
      const rootDir = join(this.options.buildDir, rootId, 'static')
      const sourceCache = {}
      return {
        source(req, res, next) {
          const source = req.url.slice(12)
          if (!sourceCache[source]) {
            sourceCache[source] = readJsonSync(rootDir, 'sources', `${source}.json`)
          }
          res.json(sourceCache[source])
        }
      }
    },
    source: {
      markdown(source) {
        const md = new Markdown(source, { sanitize: false })
        return md.toHTML().then(html => html.contents)
      },
      title(body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
