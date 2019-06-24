import consola from 'consola'
import { IgnorePlugin } from 'webpack'
import Markdown from '@nuxt/markdown'
import { ensureDir, exists, join, readJsonSync, remove } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  // Main blueprint, enabled by default
  enabled: () => true,
  templates: {
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
        path: '/:source(.+)',
        // Final path might be under srcDir or buildDir
        // Depends on presence of user-provided template
        // And is the reason why templates is passed to this function
        component: templates.source
      }
    ]
  },
  serverMiddleware(options) {
    const { source, base } = options.common.api.call(this)
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
