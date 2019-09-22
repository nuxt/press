import defu from 'defu'
import { Blueprint as PressBlueprint } from '@nuxt-press/core'
import Blueprint from '../../src/blueprint'

async function createInstance (config = {}, options) {
  PressBlueprint.templates = {
    'pages/source.tmpl.vue': '/var/nuxt/source.vue'
  }
  Blueprint._runGuards = undefined
  Blueprint.features._loaded = false

  const nuxt = { options: { buildDir: '/var/.nuxt' } }
  options = defu({ id: 'my-test' }, options)

  const bp = new Blueprint(nuxt, options)
  bp.blueprintOptions.webpackAliases = null
  bp.loadConfig = jest.fn().mockReturnValue(config)
  bp.setLocales = _ => _
  bp.coreSetup = _ => _
  bp.addTheme = _ => _
  bp.addServerMiddleware = _ => _
  bp.rootConfig = {}
  await bp.setup()

  bp.templates = {
    'pages/index.vue': '/var/nuxt/index.vue',
    'pages/archive.vue': '/var/nuxt/archive.vue'
  }

  return bp
}

describe('core blueprint', () => {
  test('createRoutes (no prefix)', async () => {
    const bp = await createInstance()

    const routes = bp.createRoutes()

    expect(routes).toEqual([
      {
        name: 'source-my-test-index',
        path: '/',
        component: '/var/nuxt/index.vue',
        meta: { id: 'my-test', bp: 'slides' }
      },
      {
        name: 'source-my-test',
        path: '/:source(.*)?',
        component: '/var/nuxt/source.vue',
        meta: { id: 'my-test', bp: 'slides', source: true }
      }
    ])
  })

  test('createRoutes (prefix: \'/\')', async () => {
    const bp = await createInstance({
      prefix: '/'
    })

    const routes = bp.createRoutes()

    expect(routes).toEqual([
      {
        name: 'source-my-test-index',
        path: '/',
        component: '/var/nuxt/index.vue',
        meta: { id: 'my-test', bp: 'slides' }
      },
      {
        name: 'source-my-test',
        path: '/:source(.*)?',
        component: '/var/nuxt/source.vue',
        meta: { id: 'my-test', bp: 'slides', source: true }
      }
    ])
  })

  test('createRoutes (prefix: \'my-prefix\')', async () => {
    const bp = await createInstance({
      prefix: 'my-prefix'
    })

    const routes = bp.createRoutes()

    expect(routes).toEqual([
      {
        name: 'source-my-test-index',
        path: '/my-prefix/',
        component: '/var/nuxt/index.vue',
        meta: { id: 'my-test', bp: 'slides' }
      },
      {
        name: 'source-my-test',
        path: '/my-prefix/:source(.*)?',
        component: '/var/nuxt/source.vue',
        meta: { id: 'my-test', bp: 'slides', source: true }
      }
    ])
  })

  test('createRoutes (locales: [en, nl])', async () => {
    const bp = await createInstance({
      prefix: '',
      $hasLocales: false,
      $locales: [
        { code: 'en' },
        { code: 'nl' }
      ]
    })

    const routes = bp.createRoutes()

    expect(routes).toEqual([
      {
        name: 'source-my-test-index',
        path: '/',
        component: '/var/nuxt/index.vue',
        meta: { id: 'my-test', bp: 'slides' }
      },
      {
        name: 'source-my-test',
        path: '/:source(.*)?',
        component: '/var/nuxt/source.vue',
        meta: { id: 'my-test', bp: 'slides', source: true }
      }
    ])
  })

  test('createRoutes (prefix: my-prefix, locales: [en, nl])', async () => {
    const bp = await createInstance({
      prefix: 'my-prefix/',
      $hasLocales: false,
      $locales: [
        { code: 'en' },
        { code: 'nl' }
      ]
    })

    const routes = bp.createRoutes()

    expect(routes).toEqual([
      {
        name: 'source-my-test-index',
        path: '/my-prefix/',
        component: '/var/nuxt/index.vue',
        meta: { id: 'my-test', bp: 'slides' }
      },
      {
        name: 'source-my-test',
        path: '/my-prefix/:source(.*)?',
        component: '/var/nuxt/source.vue',
        meta: { id: 'my-test', bp: 'slides', source: true }
      }
    ])
  })
})
