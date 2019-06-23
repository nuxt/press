import consola from 'consola'
import { IgnorePlugin } from 'webpack'
import { ensureDir, exists, join, readJsonSync, remove } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  templates: {
    'plugin': 'plugin.js',
    'nuxt-template': 'components/nuxt-template.js',
    'source': 'pages/source.vue'
  },
  eject: ['plugin', 'source'],
  routes(templates) {
    return [
      {
        name: 'source',
        path: '/:source(.+)',
        component: templates.source
      }
    ]
  },
  serverMiddleware() {
    const { source, base } = this.$press.api.call(this)
    return [
      base,
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          source(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  hooks: {
    async beforeBuild() {
      this.options.build.plugins.unshift(new IgnorePlugin(/\.md$/))
      const pagesDir = join(this.options.srcDir, this.options.dir.pages)
      if (!exists(pagesDir)) {
        this.$press.$placeholderPagesDir = pagesDir
        await ensureDir(pagesDir)
      }
    },
    async compileBuild() {
      if (this.$press.$placeholderPagesDir) {
        await remove(this.$press.$placeholderPagesDir)
      }
    }
  },
  options: {
    api() {
      const rootDir = this.options.buildDir
      const sourceCache = {}
      return {
        base(_, res, next) {
          res.json = (data) => {
            res.type = 'application/json'
            res.write(JSON.stringify(data))
            res.end()
          }
          next()
        },
        source(req, res, next) {
          try {
            const source = req.url.slice(12)
            if (!sourceCache[source]) {
              sourceCache[source] = readJsonSync(rootDir, 'sources', `${source}.json`)
            }
            res.json(sourceCache[source])
          } catch (err) {
            consola.warn(err)
          }
        }
      }
    }
  }
}
