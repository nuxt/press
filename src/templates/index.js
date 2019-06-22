
export const blog = {
  'blog/assets': /\.svg$/,
  'blog/layout': {
    src: 'blog/layout.vue',
    fileName: 'layouts/blog.vue'
  },
  'blog/sidebar': {
    src: 'blog/components/sidebar.vue',
    fileName: 'components/blog/sidebar.vue'
  },
  'blog/index': {
    src: 'blog/pages/index.vue',
    fileName: 'pages/blog/index.vue'
  },
  'blog/entry': {
    src: 'blog/pages/entry.vue',
    fileName: 'pages/blog/entry.vue'
  },
  'blog/archive': {
    src: 'blog/pages/archive.vue',
    fileName: 'pages/blog/archive.vue'
  }
}

export const docs = {
  'docs/plugin': {
    src: 'components/scroll-plugin.js',
    fileName: 'plugins/docs.js',
    ssr: false
  },
  'docs/layout': {
    src: 'docs/layout.vue',
    fileName: 'layouts/docs.vue'
  },
  'docs/observer': {
    src: 'components/observer.js',
    fileName: 'components/observer.js'
  },
  'docs/toc': {
    src: 'docs/components/toc.vue',
    fileName: 'components/docs/toc.vue'
  },
  'docs/index': {
    src: 'docs/pages/index.vue',
    fileName: 'pages/docs/index.vue'
  },
  'docs/topic': {
    src: 'docs/pages/topic.vue',
    fileName: 'pages/docs/topic.vue'
  }
}

export const slides = {
  'slides/plugin': {
    src: 'slides/plugin.js',
    fileName: 'plugins/slides.js',
    ssr: false
  },
  'slides/layout': {
    src: 'slides/layout.vue',
    fileName: 'layouts/slides.vue'
  },
  'slides/index': {
    src: 'slides/pages/index.vue',
    fileName: 'pages/slides/index.vue'
  },
  'slides/slides': {
    src: 'slides/pages/slides.vue',
    fileName: 'pages/slides/slides.vue'
  }
}
