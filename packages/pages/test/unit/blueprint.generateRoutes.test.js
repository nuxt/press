import defu from 'defu'
import * as utils from '@nuxt-press/utils'
import Blueprint from '../../src/blueprint'

jest.mock('@nuxt-press/utils')

async function createInstance (config = {}, options) {
  Blueprint._runGuards = undefined
  Blueprint.templates = undefined

  const nuxt = { options: { css: [] } }
  options = defu({ id: 'my-test' }, options)

  const bp = new Blueprint(nuxt, options)
  bp.nuxt = nuxt
  bp.blueprintOptions = {}
  bp.loadConfig = jest.fn().mockReturnValue(config)
  bp.setLocales = _ => _
  bp.coreSetup = _ => _
  bp.createApi = _ => _
  bp.rootConfig = {}
  await bp.setup()

  return bp
}

describe('pages blueprint', () => {
  test('createGenerateRoutes', async () => {
    const { normalizePath } = jest.requireActual('@nuxt-press/utils')
    utils.normalizePath.mockImplementation(normalizePath)

    const bp = await createInstance()

    bp.data = {
      sources: {
        '/my-page/': {}
      }
    }

    const prefix = jest.fn(p => p)
    const routes = await bp.createGenerateRoutes('/var/nuxt', prefix)

    await Promise.all(routes.map(route => route.payload))

    expect(routes).toEqual([
      { route: '/my-page/', payload: undefined }
    ])
  })

  test('generateExtendRoutes', async () => {
    const { normalizePathPrefix } = jest.requireActual('@nuxt-press/utils')
    utils.normalizePathPrefix.mockImplementation(normalizePathPrefix)

    const bp = await createInstance()

    bp.getGenerateRoot = jest.fn().mockReturnValue('/var/nuxt/_press')
    bp.data = {
      sources: {
        '/my-page/': {}
      }
    }

    const routes = await bp.generateExtendRoutes()

    await Promise.all(routes.map(route => route.payload))

    expect(routes).toEqual([
      { route: '/my-page/', payload: undefined }
    ])
  })
})
