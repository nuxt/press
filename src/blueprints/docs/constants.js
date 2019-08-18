export const indexKeys = ['index', 'readme']

export const templates = {
  header: 'components/header.vue',
  home: 'components/home.vue',
  layout: 'layouts/docs.vue',
  mixin: 'mixins/docs.js',
  'nav-link': 'components/nav-link.vue',
  'outbound-link-icon': 'components/outbound-link-icon.vue',
  plugin: ({ id }) => ({ src: 'plugins/press.docs.js', dest: `plugins/press.${id}.js` }),
  sidebar: 'components/sidebar.vue',
  'sidebar-section': 'components/sidebar-section.vue',
  'sidebar-sections': 'components/sidebar-sections.vue',
  topic: 'components/topic.vue',
  utils: 'utils.js'
}

export const defaultDir = 'docs'
export const defaultPrefix = '/docs/'

export const maxSidebarDepth = 2

export const defaultMetaSettings = {
  sidebarDepth: 1
}
