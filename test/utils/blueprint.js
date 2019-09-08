import defu from 'defu'

export function createBlueprintContext (blueprint, overrides = {}) {
  return defu(overrides, {
    constructor: {
    },
    nuxt: {
      options: {
        dev: true
      }
    },
    config: {
      prefix: '',
      locales: undefined,
      source: {
        markdown: jest.fn().mockImplementation(() => {
          if (blueprint === 'docs') {
            return {
              toc: ['the toc'],
              html: 'the html'
            }
          }

          return 'the html'
        }),
        metadata: jest.fn().mockReturnValue({
          meta: {
            metaTest: true
          }
        }),
        title: jest.fn().mockReturnValue('the title'),
        id: jest.fn().mockReturnValue('the rss id'),
        path: jest.fn().mockReturnValue('the_path')
      }
    }
  })
}
