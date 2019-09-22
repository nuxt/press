import path from 'path'
import Markdown from '@nuxt/markdown'
import customContainer from 'remark-container'
import graymatter from 'gray-matter'
import defu from 'defu'

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
  metadata (source) {
    const defaultMetaSettings = this.constructor.defaultConfig.metaSettings

    if (source.trimLeft().startsWith('---')) {
      const { content, data } = graymatter(source)

      const meta = defu(data, defaultMetaSettings)

      if (meta.sidebar === 'auto') {
        meta.sidebarDepth = this.constructor.defaultConfig.maxSidebarDepth
      }

      return {
        content,
        meta
      }
    }

    return {
      meta: {
        ...defaultMetaSettings
      }
    }
  },
  title (body, sourcePath, toc) {
    if (toc && toc[0]) {
      return toc[0][1]
    }

    const titleMatch = body.substr(body.indexOf('#')).match(/^#+\s+(.*)/)

    if (titleMatch) {
      return titleMatch[1]
    }

    const { name: fileName } = path.parse(sourcePath)
    return fileName
  }
}

export default source
