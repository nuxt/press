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
    }
  }
}
