import { readJsonSync } from '../../utils'

export default {
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
    const api = this.$press.api()
    const sourceHandler = this.$press.api.source || api.source.bind(this)
    return [
      api.base.bind(this),
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          sourceHandler(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  options: {
    api() {
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
              sourceCache[source] = readStaticJson(rootDir, 'sources', `${source}.json`)
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
