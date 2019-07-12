export default {
  mode: 'docs',
  docs: {
    'dir': '',
    'prefix': '/',
    'title': 'Test docs',
    'nav': [
      {
        'text': 'A test',
        'link': '/a'
      },
      {
        'text': 'B test',
        'link': '/b'
      },
      {
        'text': 'C test',
        'link': '/c'
      },
      {
        'GitHub': 'https://github.com/nuxt/press'
      }
    ],
    'sidebar': {
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
  }
}
