import Blueprint from '../../src/blueprint'

class TestBlueprint extends Blueprint {
  static id = 'test-blueprint'
}

describe('core blueprint', () => {
  beforeEach(() => {
    TestBlueprint._runGuards = undefined
    Blueprint.templates = {
      'pages/source.tmpl.vue': '/var/nuxt/source.vue'
    }
  })

  test('createRoutes (no prefix)', async () => {
    const nuxt = { options: {} }
    const options = { id: 'my-test' }

    const bp = new TestBlueprint(nuxt, options)
    bp.blueprintOptions.webpackAliases = null
    bp.loadConfig = jest.fn().mockReturnValue({})
    bp.setLocales = jest.fn()
    bp.coreSetup = jest.fn()
    bp.rootConfig = {}
    await bp.setup()

    const routes = bp.createRoutes()

    expect(routes).toEqual([{
      name: 'source-my-test',
      path: '/:source(.*)?',
      component: '/var/nuxt/source.vue',
      meta: {
        id: 'my-test',
        bp: 'test-blueprint',
        source: true
      }
    }])
  })

  test('createRoutes (prefix: \'/\')', async () => {
    const nuxt = { options: {} }
    const options = { id: 'my-test' }

    const bp = new TestBlueprint(nuxt, options)
    bp.blueprintOptions.webpackAliases = null
    bp.loadConfig = jest.fn().mockReturnValue({
      prefix: '/'
    })
    bp.setLocales = jest.fn()
    bp.coreSetup = jest.fn()
    bp.rootConfig = {}
    await bp.setup()

    const routes = bp.createRoutes()

    expect(routes).toEqual([{
      name: 'source-my-test',
      path: '/:source(.*)?',
      component: '/var/nuxt/source.vue',
      meta: {
        id: 'my-test',
        bp: 'test-blueprint',
        source: true
      }
    }])
  })

  test('createRoutes (prefix: \'my-prefix\')', async () => {
    const nuxt = { options: {} }
    const options = { id: 'my-test' }

    const bp = new TestBlueprint(nuxt, options)
    bp.blueprintOptions.webpackAliases = null
    bp.loadConfig = jest.fn().mockReturnValue({
      prefix: 'my-prefix'
    })
    bp.setLocales = jest.fn()
    bp.coreSetup = jest.fn()
    bp.rootConfig = {}
    await bp.setup()

    const routes = bp.createRoutes()

    expect(routes).toEqual([{
      name: 'source-my-test',
      path: '/my-prefix/:source(.*)?',
      component: '/var/nuxt/source.vue',
      meta: {
        id: 'my-test',
        bp: 'test-blueprint',
        source: true
      }
    }])
  })

  test('createRoutes (locales: [en, nl])', async () => {
    const nuxt = { options: {} }
    const options = { id: 'my-test' }

    const bp = new TestBlueprint(nuxt, options)
    bp.blueprintOptions.webpackAliases = null
    bp.loadConfig = jest.fn().mockReturnValue({
      prefix: '',
      $hasLocales: true,
      $locales: [
        { code: 'en' },
        { code: 'nl' }
      ]
    })
    bp.setLocales = jest.fn()
    bp.coreSetup = jest.fn()
    bp.rootConfig = {}
    await bp.setup()

    const routes = bp.createRoutes()

    expect(routes).toEqual([{
      name: 'source-my-test-locales-en_nl',
      path: '/:locale(en|nl)?/:source(.*)?',
      component: '/var/nuxt/source.vue',
      meta: {
        id: 'my-test',
        bp: 'test-blueprint',
        source: true
      }
    }])
  })

  test('createRoutes (prefix: my-prefix, locales: [en, nl])', async () => {
    const nuxt = { options: {} }
    const options = { id: 'my-test' }

    const bp = new TestBlueprint(nuxt, options)
    bp.blueprintOptions.webpackAliases = null
    bp.loadConfig = jest.fn().mockReturnValue({
      prefix: 'my-prefix/',
      $hasLocales: true,
      $locales: [
        { code: 'en' },
        { code: 'nl' }
      ]
    })
    bp.setLocales = jest.fn()
    bp.coreSetup = jest.fn()
    bp.rootConfig = {}
    await bp.setup()

    const routes = bp.createRoutes()

    expect(routes).toEqual([{
      name: 'source-my-test-locales-en_nl',
      path: '/my-prefix/:locale(en|nl)?/:source(.*)?',
      component: '/var/nuxt/source.vue',
      meta: {
        id: 'my-test',
        bp: 'test-blueprint',
        source: true
      }
    }])
  })
})
