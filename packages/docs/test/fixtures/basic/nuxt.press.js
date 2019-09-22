export default {
  docs: {
    dir: '',
    prefix: '/',
    title: 'Test docs',
    search: true,
    async extendStaticRoutes (routes, staticImport) {
      const path = '/b-ext/'
      const payload = {
        ...await staticImport('b'),
        path
      }

      routes[path] = payload
    },
    nav: [
      {
        'text': 'A test',
        'link': '/a/'
      },
      {
        'text': 'B test',
        'link': '/b/'
      },
      {
        'text': 'C test',
        'link': '/c/'
      },
      {
        'GitHub': 'https://github.com/nuxt/press'
      }
    ],
    sidebar: {
      '/': [
        '/',
        {
          'title': 'A test',
          'children': [
            '/a',
            '/a/first',
            '/a/second'
          ]
        }
      ],
      '/c': [
        '/c',
        '/a/second'
      ]
    }
  },
  mode: 'docs'
}
