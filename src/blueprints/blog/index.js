import Markdown from '@nuxt/markdown'
import { exists, join, slugify, readJsonSync } from '../../utils'
import data from './data'

export default {
  // Include data loader
  data,
  enabled(options) {
    // Enable blog if srcDir/blog/ exists
    return exists(join(this.options.srcDir, options.dir))
  },
  templates: {
    'assets': /\.svg$/,
    'layout': 'layout.vue',
    'sidebar': 'components/sidebar.vue',
    'index': 'pages/index.vue',
    'entry': 'pages/entry.vue',
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
        path: `${this.$press.blog.prefix}/archive`,
        component: templates.archive
      }
    ]
  },
  generateRoutes(data, prefix, staticRoot) {
    return [
      ...Object.keys(data.topLevel).map(route => ({
        route: prefix(route),
        payload: require(`${staticRoot}/blog/${route}.json`)
      })),
      ...Object.keys(data.sources).map(route => ({
        route,
        payload: require(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  serverMiddleware() {
    const { index, archive } = this.$press.blog.api.call(this)
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/blog/index')) {
          index(req, res, next)
        } else if (req.url.startsWith('/api/blog/archive')) {
          archive(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  hooks: {
    build: {
      done({ options }) {
        this.options.watch.push(`~/${options.blog.dir}*.md`)
        this.options.watch.push(`~/${options.blog.dir}**/*.md`)
      }
    }
  },
  options: {
    dir: 'blog',
    prefix: '/blog',

    // Blog metadata
    meta: {
      title: 'A NuxtPress Blog',
      links: [],
      icons: [],
      // Used in RFC4151-based RSS feed entry tags
      tagDomain: 'nuxt.press'
    },

    // If in Nuxt's SPA mode, setting custom API
    // handlers also disables bundling of index.json
    // and source/*.json files into the static/ folder
    api() {
      const cache = {}
      const rootDir = this.options.buildDir
      return {
        index(req, res, next) {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'blog', 'index.json')
          }
          res.json(cache.index)
        },
        archive(req, res, next) {
          if (this.options.dev || !cache.archive) {
            cache.archive = readJsonSync(rootDir, 'blog', 'archive.json')
          }
          res.json(cache.archive)
        }
      }
    },

    source: {
      async markdown(source) {
        const md = new Markdown(source, {
          skipToc: true,
          sanitize: false
        })
        const html = await md.toHTML()
        return html.contents
      },

      // head() parses the starting block of text in a Markdown source,
      // considering the first and (optionally) second lines as
      // publishing date and summary respectively
      head(source) {
        const parsed = source
          .substr(0, source.indexOf('#')).trim().split(/\n\n/)
        const published = new Date(Date.parse(parsed[0]))
        return { published, summary: parsed[1] }
      },

      // path() determines the final URL path of a Markdown source
      // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
      path({ title, published }) {
        const slug = slugify(title.replace(/\s+/g, '-')).toLowerCase()
        const date = published.toString().split(/\s+/).slice(1, 4).reverse()
        return `/${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}`
      },

      // id() determines the unique RSS ID of a Markdown source
      // Default RFC4151-based format is used. See https://tools.ietf.org/html/rfc4151
      id({ published, path }) {
        const tagDomain = this.$press.blog.meta.tagDomain
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
