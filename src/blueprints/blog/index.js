import Markdown from '@nuxt/markdown'
import { slugify } from '../utils'

export default {
  templates: {
    assets: /\.svg$/,
    layout: 'layout.vue',
    sidebar: 'components/sidebar.vue',
    index: 'pages/index.vue',
    entry: 'pages/entry.vue',
    archive: 'pages/archive.vue'
  },
  routes(templates) {
    return [
      {
        name: 'blog_index',
        path: this.$press.blog.prefix,
        component: 'pages/blog/index.vue'
      },
      {
        name: 'blog_archive',
        path: `${this.$press.blog.prefix}/archive`,
        component: 'pages/blog/archive.vue'
      }
    ]
  },
  serverMiddleware() {
    let indexHandler
    let archiveHandler

    const configAPI = this.$press.blog.api
    if (configAPI.index && configAPI.archive) {
      indexHandler = configAPI.index
      archiveHandler = configAPI.archive
    } else {
      const blogAPI = api.blog(this.options.buildDir)
      indexHandler = blogAPI.index
      archiveHandler = blogAPI.archive
    }
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/blog/index')) {
          indexHandler(req, res, next)
        } else if (req.url.startsWith('/api/blog/archive')) {
          archiveHandler(req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  defaults = {
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
          if (dev || !cache.index) {
            cache.index = readStaticJson(rootDir, 'blog', 'index.json')
          }
          res.json(cache.index)
        },
        archive(req, res, next) {
          if (dev || !cache.archive) {
            cache.archive = readStaticJson(rootDir, 'blog', 'archive.json')
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
        const slug = title.replace(/\s+/g, '-')
        const date = published.toString().split(/\s+/).slice(1, 4).reverse()
        return `/${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slugify(slug)}`
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
