import 'gray-matter'
import fs from 'fs-extra'
import { createBlueprintContext } from 'test-utils'
import { _parseEntry } from '../../src/blueprint/data'

jest.mock('gray-matter')
jest.mock('fs-extra')

describe('parsePage', () => {
  afterEach(() => jest.resetAllMocks())

  test('basic functionality', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('blog')
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parseEntry.call(thisContext, pathInfo)

    expect(source.meta).toBeUndefined()
    expect(source.metaTest).toBe(true)
    expect(thisContext.config.source.markdown).toHaveBeenCalledTimes(1)

    expect(source.type).toEqual('entry')
    expect(thisContext.config.source.title).toHaveBeenCalledTimes(1)
    expect(source.title).toEqual('the title')
    expect(source.body).toEqual('the html')

    expect(source.path).toEqual('/the_path/')
    expect(source.src).toEqual('/var/nuxt/index.md')
  })

  test('doesnt return src path in production', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('blog', { nuxt: { options: { dev: false } } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parseEntry.call(thisContext, pathInfo)

    expect(source.src).toBeUndefined()
  })
})
