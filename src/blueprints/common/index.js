import chokidar from 'chokidar'
import { IgnorePlugin } from 'webpack'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import { importModule, ensureDir, exists, join, readJsonSync, remove, trimEnd } from '../../utils'
import data, { loadPage } from './data'

export default {
  // Include data loader
  data,
  // Main blueprint, enabled by default
  enabled: () => true,
  templates: {
    // [type?:eject_key]: 'path in templates/'
    'middleware': 'middleware/press.js',
    'nuxt-static': 'components/nuxt-static.js',
    'press-link': 'components/press-link.js',
    'nuxt-template': 'components/nuxt-template.js',
    'observer': 'components/observer.js',
    'plugin': 'plugins/press.js',
    'plugin:scroll': 'plugins/scroll.client.js',
    'source': 'pages/source.vue',
    'utils': 'utils.js'
  },
  routes (templates) {
    const $press = this.$press

    // always add '/' to support pages
    const prefixes = ['/']
    for (const blueprint of ['blog', 'docs', 'slides']) {
      if ($press[blueprint]) {
        const prefix = $press[blueprint].prefix || '/'
        if (!prefixes.includes(prefix)) {
          prefixes.push(prefix)
        }
      }
    }

    const routes = []
    for (let prefix of prefixes) {
      prefix = trimEnd(prefix, '/')

      let prefixName = ''
      if (prefix) {
        prefixName = `-${prefix.replace('/', '')}`

        if (prefix[0] !== '/') {
          prefix = `/${prefix}`
        }
      }

      const hasLocales = !!$press.i18n
      if (hasLocales) {
        routes.push({
          name: `source-locale${prefixName}`,
          path: `${prefix}/:locale/:source(.*)`,
          component: templates.source
        })

        routes.push({
          name: `source${prefixName}`,
          path: `${prefix}/`,
          meta: { sourceParam: true },
          component: templates.source
        })

        continue
      }

      routes.push({
        name: `source${prefixName}`,
        path: `${prefix}/:source(.*)`,
        component: templates.source
      })
    }

    return routes
  },
  generateRoutes (data, _, staticRoot) {
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
  serverMiddleware ({ options, rootId, id }) {
    const { source } = typeof options.common.api === 'function'
      ? options.common.api.call(this, { rootId, id })
      : options.common.api
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
    async before ({ options }) {
      this.options.build.plugins.unshift(new IgnorePlugin(/\.md$/))
      const pagesDir = join(this.options.srcDir, this.options.dir.pages)
      if (!exists(pagesDir)) {
        this.$press.$placeholderPagesDir = pagesDir
        await ensureDir(pagesDir)
      }
    },
    async done () {
      chokidar.watch(['pages/*.md'], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
        .on('change', async path => this.$pressSourceEvent('change', await loadPage(path)))
        .on('add', async path => this.$pressSourceEvent('add', await loadPage(path)))
        .on('unlink', path => this.$pressSourceEvent('unlink', { path }))

      if (this.$press.$placeholderPagesDir) {
        await remove(this.$press.$placeholderPagesDir)
      }
    }
  },
  options: {
    api ({ rootId }) {
      const rootDir = join(this.options.buildDir, rootId, 'static')
      const sourceCache = {}
      return {
        source (source, _, res, next) {
          if (this.options.dev || !sourceCache[source]) {
            let sourceFile = join(rootDir, 'sources', `${source}/index.json`)

            if (!exists(sourceFile)) {
              sourceFile = join(rootDir, 'sources', `${source}.json`)

              if (!exists(sourceFile)) {
                const err = new Error('NuxtPress: source not found')
                err.statusCode = 404
                next(err)
                return
              }
            }

            sourceCache[source] = readJsonSync(sourceFile)
          }
          res.json(sourceCache[source])
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
      title (body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
