import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import {
  _import,
  resolve,
  exists,
  join,
  slugify,
  updateConfig,
  readJsonSync,
  isSingleMode,
  routePath
} from '../../utils'

import data from './data'

let mdProcessor

export default {
  // Include data loader
  data,
  // Enable blog if srcDir/blog/ exists
  enabled(options) {
    const modeCheck = isSingleMode.call(this, ['docs', 'slides'])
    if (options.$standalone === 'blog' || modeCheck.single) {
      if (!modeCheck.pages) {
        options.dir = ''
      }
      if (exists(this.options.srcDir, 'posts')) {
        options.dir = 'posts'
      }
      if (exists(this.options.srcDir, 'entries')) {
        options.dir = 'entries'
      }
    }
    return exists(this.options.srcDir, options.dir)
  },
  templates: {
    'assets': /\.svg$/,
    'layout': 'layout.vue',
    'sidebar': 'components/sidebar.vue',
    'index': 'pages/index.vue',
    'entry': 'components/entry.vue',
    'archive': 'pages/archive.vue'
  },
  ejectable: [
    'layout',
    'sidebar',
    'index',
    'entry',
    'archive'
  ],
  routes(templates) {
    return [
      {
        name: 'blog_index',
        path: this.$press.blog.prefix,
        component: templates.index
      },
      {
        name: 'blog_archive',
        path: `${this.$press.blog.prefix}archive`,
        component: templates.archive
      }
    ]
  },
  generateRoutes(data, prefix, staticRoot) {
    return [
      ...Object.keys(data.topLevel).map(async route => ({
        route: prefix(routePath(route)),
        payload: await _import(`${staticRoot}${this.$press.blog.prefix}${route}.json`)
      })),
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await _import(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  serverMiddleware({ options, rootId, id }) {
    const { index, archive } = options.blog.api.call(this, { rootId, id })
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/blog/index')) {
          index.call(this, req, res, next)
        } else if (req.url.startsWith('/api/blog/archive')) {
          archive.call(this, req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    before() {
      if (!exists(this.options.srcDir, 'nuxt.press.css')) {
        this.options.css.push(resolve('blueprints/blog/theme.css'))
      }
    },
    async compile({ rootId }) {
      await updateConfig.call(this, rootId, { blog: this.$press.blog })
    },
    done({ options }) {
      this.options.watch.push(`~/${options.blog.dir}/*.md`)
      this.options.watch.push(`~/${options.blog.dir}/**/*.md`) //*/
    }
  },
  options: {
    dir: 'blog',
    prefix: '/blog/',

    // Blog metadata
    title: 'A NuxtPress Blog',
    links: [],
    icons: [],
    // Used in RFC4151-based RSS feed entry tags
    tagDomain: 'nuxt.press',

    // If in Nuxt's SPA mode, setting custom API
    // handlers also disables bundling of index.json
    // and source/*.json files into the static/ folder
    api({ rootId }) {
      const cache = {}
      const rootDir = join(this.options.buildDir, rootId, 'static')
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'blog', 'index.json')
          }
          res.json(cache.index)
        },
        archive: (req, res, next) => {
          if (this.options.dev || !cache.archive) {
            cache.archive = readJsonSync(rootDir, 'blog', 'archive.json')
          }
          res.json(cache.archive)
        }
      }
    },

    source: {
      async markdown(source) {
        if (!mdProcessor) {
          const config = {
            skipToc: true,
            sanitize: false
          }

          mdProcessor = new Markdown(config).createProcessor()
        }

        const { contents } = await mdProcessor.toHTML(source)
        return contents
      },

      // head() parses the starting block of text in a Markdown source,
      // considering the first and (optionally) second lines as
      // publishing date and summary respectively
      head(source) {
        if (source.trimLeft().startsWith('---')) {
          const { content, data } = graymatter(source)
          if (data.date) {
            data.published = new Date(Date.parse(data.date))
          }
          delete data.date
          return { ...data, content }
        }
        const published = source.substr(0, source.indexOf('#')).trim()
        return {
          published: new Date(Date.parse(published))
        }
      },

      // path() determines the final URL path of a Markdown source
      // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
      path({ title, published }) {
        const slug = slugify(title)
        const date = published.toString().split(/\s+/).slice(1, 4).reverse()
        return `${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}`
      },

      // id() determines the unique RSS ID of a Markdown source
      // Default RFC4151-based format is used. See https://tools.ietf.org/html/rfc4151
      id({ published, path }) {
        const tagDomain = this.$press.blog.tagDomain
        const year = published.getFullYear()
        return `tag:${tagDomain},${year}:${path}`
      },

      // title() determines the title of a Markdown source
      title(body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
}
