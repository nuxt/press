import chokidar from 'chokidar'
import { IgnorePlugin } from 'webpack'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import {
  importModule,
  ensureDir,
  exists,
  join,
  readJsonSync,
  remove,
  trimSlash
} from '../../utils'
import data, { parsePage } from './data'

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
  routes ({ rootOptions, registeredBlueprintIds, availableBlueprintIds }, templates) {
    const hasLocales = rootOptions.i18n && rootOptions.i18n.locales.length > 0
    let rootAdded = false

    const routes = []
    for (const key of registeredBlueprintIds) {
      const options = rootOptions[key]
      const blueprintId = availableBlueprintIds.includes(key) ? key : (options && options.blueprint)

      if (blueprintId !== 'common') {
        const prefix = options.$normalizedPrefix || ''
        const routeName = `source-${key.toLowerCase()}`

        if (hasLocales) {
          const locales = rootOptions.i18n.locales.map(locale => locale.code || locale)
          locales.sort()

          routes.push({
            name: `${routeName}-locales-${locales.join('_')}`,
            path: `${prefix}/:locale(${locales.join('|')})?/:source(.*)?`,
            component: templates.source,
            meta: { id: key, source: true }
          })

          continue
        }

        routes.push({
          name: routeName,
          path: `${prefix}/:source(.*)?`,
          component: templates.source,
          meta: { id: key, source: true }
        })

        if (!prefix) {
          rootAdded = true
        }
      }
    }

    if (!rootAdded) {
      routes.push({
        name: 'source-pages',
        path: `/:source(.*)?`,
        component: templates.source,
        meta: { id: 'common', source: true }
      })
    }

    return routes
  },
  generateRoutes ({ data }, _, staticRoot) {
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
    const { source } = typeof options.api === 'function'
      ? options.api.call(this, { rootId, id })
      : options.api
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          const sourcePath = trimSlash(req.url.slice(12))
          source.call(this, sourcePath, req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    async before ({ rootOptions }) {
      this.options.build.plugins.unshift(new IgnorePlugin(/\.md$/))
      const pagesDir = join(this.options.srcDir, this.options.dir.pages)

      if (!exists(pagesDir)) {
        rootOptions.$placeholderPagesDir = pagesDir
        await ensureDir(pagesDir)
      }
    },
    async done (context) {
      if (!this.nuxt.options.dev) {
        return
      }

      const { rootOptions } = context

      chokidar.watch(['pages/*.md'], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
        .on('change', async path => this.$pressSourceEvent('change', await parsePage(context, path)))
        .on('add', async path => this.$pressSourceEvent('add', await parsePage(context, path)))
        .on('unlink', path => this.$pressSourceEvent('unlink', { path }))

      if (rootOptions.$placeholderPagesDir) {
        await remove(rootOptions.$placeholderPagesDir)
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
