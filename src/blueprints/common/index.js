export default {
  routes(templates) {
    return [
      {
        name: 'source',
        path: '/:source(.+)',
        component: templates.source
      }
    ]
  },
  defaults: {
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
