import 'gray-matter'
import fs from 'fs-extra'
import { createBlueprintContext } from 'test-utils'
import { _parsePage } from '../../src/blueprint/data'

jest.mock('gray-matter')
jest.mock('fs-extra')

describe('parsePage', () => {
  afterEach(() => jest.resetAllMocks())

  test('basic functionality', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('docs')
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.meta).toEqual({ metaTest: true })
    expect(thisContext.config.source.markdown).toHaveBeenCalledTimes(1)
    expect(source.toc).toEqual(['the toc'])

    expect(source.source.type).toEqual('topic')
    expect(thisContext.config.source.title).toHaveBeenCalledTimes(1)
    expect(source.source.title).toEqual('the title')
    expect(source.source.body).toEqual('the html')

    expect(source.source.path).toEqual('/')
    expect(source.source.src).toEqual('/var/nuxt/index.md')
  })

  test('doesnt return src path in production', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('docs', { nuxt: { options: { dev: false } } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.source.src).toBeUndefined()
  })

  test('adds correct locale from source path', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('docs', { config: { locales: [{ code: 'en' }] } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'en/index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.source.locale).toEqual('en')
    expect(source.source.path).toEqual('/en/')
    expect(source.source.src).toEqual('/var/nuxt/en/index.md')
  })

  test('adds correct locale from prefix', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('docs', { config: { locales: [{ code: 'en' }] } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: 'en',
      path: 'index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.source.locale).toEqual('en')
    expect(source.source.path).toEqual('/en/')
    expect(source.source.src).toEqual('/var/nuxt/en/index.md')
  })
})
