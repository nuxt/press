import Markdown from '@nuxt/markdown'

export default {
  dir: 'slides',
  prefix: '/slides',
  api: {
    index: null
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
    // path() determines the final URL path of a Markdown source
    // In 'slides' mode, the default format is <prefix>/slides/<slug>
    path(fileName) {
      return `/slides/${fileName.toLowerCase()}`
    }
  }
}
