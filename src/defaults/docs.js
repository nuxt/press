import Markdown from '@nuxt/markdown'
import { slugify } from '../utils'

export default {
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
