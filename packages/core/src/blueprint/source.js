import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'

const source = {
  processor () {
    return new Markdown({ toc: false, sanitize: false })
  },
  markdown (source, processor) {
    return processor.toMarkup(source).then(({ html }) => html)
  },
  metadata (source) {
    if (source.trimLeft().startsWith('---')) {
      const { content: body, data } = graymatter(source)
      return { ...data, body }
    }
    return {}
  },
  title (body) {
    const [, title] = body.substr(body.indexOf('# ')).match(/^#\s+(.*)/)
    return title || ''
  },
  path (fileName) {
    return fileName.toLowerCase()
  }
}

export default source
