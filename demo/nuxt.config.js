import NuxtPress from '../src'
export default {
  modules: [NuxtPress],
  css: ['~/assets/hello.css'],
  press: {
    components: {
    },
    blog: {
      meta: {
        links: [
          {Home: '/blog'},
          {Archive: '/blog/archive'},
          {About: '/blog/about'},
        ],
        icons: [
          {github: 'http://github.com/nuxt/nuxt.js'},
          {twitter: 'https://twitter.com/nuxt_js'}
        ]
      }
    },
    docs: {
      title: 'Demo',
      nav: [
        { text: 'Guide', link: '/docs' },
        { text: 'API', link: '/docs/api/' },
        { text: 'Github', link: 'https://github.com/nuxt/press' },
      ],
      sidebar: [
        "/",
        "/guide",
        "/customize",
        [
          "/test",
          "Testttttttt"
        ],
        "/test/test"
      ]
    }
  }
}
