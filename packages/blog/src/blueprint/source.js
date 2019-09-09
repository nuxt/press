import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import { slugify } from '@nuxt-press/utils'

const source = {
  processor () {
    return new Markdown({
      toc: false,
      sanitize: false
    })
  },
  markdown (source, processor) {
    return processor.toMarkup(source).then(({ html }) => html)
  },

  // metadata() parses the starting block of text in a Markdown source,
  // considering the first and (optionally) second lines as
  // publishing date and summary respectively
  metadata (source, fileName) {
    if (source.trimLeft().startsWith('---')) {
      const { content, data: meta } = graymatter(source)
      if (meta.date) {
        meta.published = new Date(Date.parse(meta.date))
      }
      delete meta.date

      return {
        content,
        meta
      }
    }

    let published
    published = source.substr(0, source.indexOf('#')).trim()
    published = Date.parse(published)
    if (isNaN(published)) {
      throw new Error(`Missing or invalid publication date in ${fileName} -- see documentation at https://nuxt.press`)
    }
    return {
      meta: {
        published: new Date(published)
      }
    }
  },

  // path() determines the final URL path of a Markdown source
  // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
  path (fileName, { title, published }) {
    const slug = slugify(title || fileName)
    const date = published.toString().split(/\s+/).slice(1, 4).reverse()
    return `${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}/`
  },

  // id() determines the unique RSS ID of a Markdown source
  // Default RFC4151-based format is used. See https://tools.ietf.org/html/rfc4151
  id ({ published, path }) {
    const tagDomain = this.config.feed.tagDomain
    const year = published.getFullYear()
    return `tag:${tagDomain},${year}:${path}`
  },

  // title() determines the title of a Markdown source
  title (body) {
    const titleMatch = body.substr(body.indexOf('#')).match(/^#\s+(.*)/)
    return titleMatch ? titleMatch[1] : ''
  }
}

export default source
