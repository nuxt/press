import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'

const source = {
  processor () {
    return new Markdown({
      toc: true,
      sanitize: false,
      extend ({ layers }) {
        layers['remark-container'] = customContainer
      }
    })
  },
  markdown (source, processor) {
    return processor.toMarkup(source)
  },
  title (fileName, body, toc) {
    if (toc && toc[0]) {
      return toc[0][1]
    }

    const titleMatch = body.substr(body.indexOf('#')).match(/^#+\s+(.*)/)

    if (titleMatch) {
      return titleMatch[1]
    }

    return fileName
  }
}

export default source
