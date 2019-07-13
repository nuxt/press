
export default {
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, maximum-scale=1.0, minimum-scale=1.0, initial-scale=1' },
    { rel: 'alternate', title: 'RSS Feed', type: 'application/rss+xml', href: '<%= blog.feed.link %><%= blog.feed.path %>' }
  ]
}
