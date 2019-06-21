import Markdown from '@nuxt/markdown'

export const templates = {
  plugin: ['plugin.js', {ssr: false}]
  layout: 'layout.vue',
  index: 'pages/index.vue',
  slides: 'pages/slides.vue'
}

export function routes(templates) {
  return [
    {
      name: 'slides_index',
      path: this.$press.slides.prefix,
      component: templates.index
    }
  ]
}
export const defaults = {
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
