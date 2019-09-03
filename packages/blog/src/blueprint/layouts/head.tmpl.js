export default {
  htmlAttrs: {
    class: 'blog'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, maximum-scale=1.0, minimum-scale=1.0, initial-scale=1' },
    { rel: 'alternate', title: 'RSS Feed', type: 'application/rss+xml', href: `<%= options.options.feed.link %><%= options.options.feed.path %>` },
    { property: 'og:site_name', content: `<%= options.options.title %>` }
  ]
}
