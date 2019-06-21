import Markdown from '@nuxt/markdown'
import { slugify } from '../utils'

export const templates = {
  plugin: 'plugin.js'
  layout: 'layout.vue',
  toc: 'components/toc.vue',
  index: 'pages/index.vue',
  topic: 'pages/topic.vue'
}

export const defaults = {
  dir: 'docs',
  prefix: '/docs',
  meta: {
    title: 'Documentation suite',
    github: 'https://github.com/...'
  },
  api: {
    index: null
  },
  source: {
    markdown(source) {
      const md = new Markdown(source, {
        sanitize: false
      })
      return md.getTocAndMarkup()
    },
    path(fileName, { title, published }) {
      if (['index', 'README'].includes(fileName)) {
        return '/topics/index'
      }
      const slug = title.replace(/\s+/g, '-')
      return `/topics/${slugify(slug)}`
    },
    title(fileName, body) {
      if (['index', 'README'].includes(fileName)) {
        return 'Intro'
      }
      return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
    }
  }
}
