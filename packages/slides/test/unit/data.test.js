import 'gray-matter'
import fs from 'fs-extra'
import { createBlueprintContext } from 'test-utils'
import { _parseSlides } from '../../src/blueprint/data'

jest.mock('gray-matter')
jest.mock('fs-extra')

describe('parsePage', () => {
  afterEach(() => jest.resetAllMocks())

  test('basic functionality', async () => {
    fs.readFile.mockReturnValue(`# Slide 1

Text

# Slide 2

Text`)

    const thisContext = createBlueprintContext('slides')
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parseSlides.call(thisContext, pathInfo)

    expect(source.meta).toBeUndefined()
    expect(source.metaTest).toBeUndefined()
    expect(thisContext.config.source.markdown).toHaveBeenCalledTimes(2)

    expect(source.type).toEqual('slides')
    expect(thisContext.config.source.title).not.toHaveBeenCalled()

    expect(source.path).toEqual('/')
    expect(source.src).toEqual('/var/nuxt/index.md')

    expect(source.slides).toBeInstanceOf(Array)
    expect(source.slides).toEqual([
      'the html',
      'the html'
    ])
  })

  test('doesnt return src path in production', async () => {
    fs.readFile.mockReturnValue('')

    const thisContext = createBlueprintContext('slides', { nuxt: { options: { dev: false } } })
    const pathInfo = {
      root: '/var/nuxt',
      prefix: '',
      path: 'index.md'
    }

    const source = await _parseSlides.call(thisContext, pathInfo)

    expect(source.src).toBeUndefined()
  })
})
