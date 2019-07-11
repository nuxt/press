import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import {
  importModule,
  resolve,
  exists,
  join,
  slugify,
  updateConfig,
  readJsonSync,
  routePath
} from '../../utils'

import data from './data'

export default {
  // Include data loader
  data,
  // Enable blog if srcDir/blog/ exists
  enabled(options) {
    if (options.$standalone === 'blog') {
      options.blog.dir = ''
      options.blog.prefix = '/'
      if (exists(this.options.srcDir, 'entries')) {
        options.blog.dir = 'entries'
      }
      if (exists(this.options.srcDir, 'posts')) {
        options.blog.dir = 'posts'
      }
      return true
    }
    return exists(this.options.srcDir, options.blog.dir)
  },
  templates: {
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
        payload: await importModule(join(staticRoot, 'blog', `${route}.json`))
      })),
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await importModule(join(staticRoot, 'sources', route))
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
      if (!this.options.watch.includes('~/**/*.md')) {
        this.options.watch.push('~/**/*.md')
      }
      if (!exists(this.options.srcDir, 'nuxt.press.css')) {
        this.options.css.push(resolve('blueprints/blog/theme.css'))
      }
    },
    async compile({ rootId }) {
      await updateConfig.call(this, rootId, { blog: this.$press.blog })
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
      processor() {
        const config = {
          skipToc: true,
          sanitize: false
        }
        return new Markdown(config).createProcessor()
      },
      async markdown(source, processor) {
        const { contents } = await processor.toHTML(source)
        return contents
      },

      // head() parses the starting block of text in a Markdown source,
      // considering the first and (optionally) second lines as
      // publishing date and summary respectively
      head(fileName, source) {
        if (source.trimLeft().startsWith('---')) {
          const { content, data } = graymatter(source)
          if (data.date) {
            data.published = new Date(Date.parse(data.date))
          }
          delete data.date
          return { ...data, content }
        }
        let published
        published = source.substr(0, source.indexOf('#')).trim()
        published = Date.parse(published)
        if (isNaN(published)) {
          return new Error(`Missing or invalid publication date in ${fileName} -- see documentation at https://nuxt.press`)
        }
        return {
          published: new Date(published)
        }
      },

      // path() determines the final URL path of a Markdown source
      // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
      path(fileName, { title, published }) {
        const slug = slugify(title || fileName)
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
        const titleMatch = body.substr(body.indexOf('#')).match(/^#\s+(.*)/)
        return titleMatch ? titleMatch[1] : ''
      }
    }
  }
}
