import NuxtPress from '../../src'
export default {
  modules: [NuxtPress],
  press: {
    blog: {
      meta: {
        links: [
          {Home: '/'},
          {Archive: '/archive'},
          {About: '/about'},
        ],
        icons: [
          {github: 'http://github.com/nuxt/nuxt.js'},
          {twitter: 'https://twitter.com/nuxt_js'}
        ]
      }
    }
  }
}
