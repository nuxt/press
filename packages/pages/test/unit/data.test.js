import 'gray-matter'
import fs from 'fs-extra'
import { createBlueprintContext } from 'test-utils'
import { _parsePage } from '../../src/data'

jest.mock('gray-matter')
jest.mock('fs-extra')

describe('parsePage', () => {
  afterEach(() => jest.resetAllMocks())

  test('basic functionality', async () => {
    fs.readFile.mockReturnValue(`# Slide 1

Text

# Slide 2

Text`)

    const thisContext = createBlueprintContext('pages')
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.meta).toBeUndefined()
    expect(source.metaTest).toBe(true)
    expect(thisContext.config.source.markdown).toHaveBeenCalledTimes(2)

    expect(source.type).toBeUndefined()
    expect(thisContext.config.source.title).not.toHaveBeenCalled()
    expect(source.title).toEqual('the html')
    expect(source.body).toEqual('the html')

    expect(source.path).toEqual('/')
    expect(source.src).toEqual('/var/nuxt/index.md')
  })

  test('doesnt return src path in production', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('pages', { nuxt: { options: { dev: false } } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parsePage.call(thisContext, pathInfo)

    expect(source.src).toBeUndefined()
  })
})
