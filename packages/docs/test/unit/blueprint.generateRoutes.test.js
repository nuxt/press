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
  bp.rootConfig = {}
  await bp.setup()

  return bp
}

describe('docs blueprint', () => {
  test('createGenerateRoutes', async () => {
    const bp = await createInstance()

    bp.data = {
      sources: [
        { path: '/my-path/' }
      ]
    }

    const prefix = jest.fn(p => p)
    const routes = await bp.createGenerateRoutes('/var/nuxt', prefix)

    await Promise.all(routes.map(route => route.payload))

    expect(routes).toEqual([
      { route: '/', payload: undefined },
      { route: '/my-path/', payload: undefined }
    ])
  })

  test('generateExtendRoutes', async () => {
    const { normalizePathPrefix } = jest.requireActual('@nuxt-press/utils')
    utils.normalizePathPrefix.mockImplementation(normalizePathPrefix)

    const bp = await createInstance({
      prefix: 'my-prefix'
    })

    bp.getGenerateRoot = jest.fn().mockReturnValue('/var/nuxt/_press')
    bp.data = {
      sources: [
        { path: '/my-path/' }
      ]
    }

    const routes = await bp.generateExtendRoutes()

    await Promise.all(routes.map(route => route.payload))

    expect(routes).toEqual([
      { route: '/my-prefix/', payload: undefined },
      { route: '/my-path/', payload: undefined }
    ])
  })
})
