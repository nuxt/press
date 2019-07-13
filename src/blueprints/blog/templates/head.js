import config from '~/nuxt.press'

export default {
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, maximum-scale=1.0, minimum-scale=1.0, initial-scale=1' },
    { rel: 'alternate', title: 'RSS Feed', type: 'application/rss+xml', href: `${config.blog.feed.link}${config.blog.feed.path}` },
    { property: 'og:site_name', content: config.blog.title }
  ]
}
