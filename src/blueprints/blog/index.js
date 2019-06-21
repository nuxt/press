import Markdown from '@nuxt/markdown'
import { slugify } from '../utils'

export const templates = {
  assets: /\.svg$/,
  layout: 'layout.vue',
  sidebar: 'components/sidebar.vue',
  index: 'pages/index.vue',
  entry: 'pages/entry.vue',
  archive: 'pages/archive.vue'
}

export function routes(templates) {
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
}

export const defaults = {
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
  api: {
    // Override /api/index handler
    // - in 'docs' mode, it should return [{ body, title }, ...]
    // - in `blog` mode, [{ body, published, summary, title }, ...]
    index: null,

    // Override /api/archive handler (blog mode only)
    // It should return an object like { yyyy: { mm: [ entry, ...] } }
    archive: null,

    // Override /api/source/<path> handler
    // - in 'docs' mode, it should return { body, title }
    // - in `blog` mode, it should return { body, published, summary, title }
    source: null
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
