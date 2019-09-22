import * as normalize from '../../src/normalize'

const normalizeInputs = [
  '',
  '/path-start_true-end_false',
  '/path-start_true-end_true/',
  'path-start_false-end_false',
  'path-start_false-end_true/',
  '/path-end_false/index',
  '/path-end_true/index/',
  '/path-also-ending-with-index'
]

describe('normalize', () => {
  test('normalizePath { default opts }', () => {
    const outputs = normalizeInputs.map(normalize.normalizePath)

    expect(outputs).toEqual([
      '/',
      '/path-start_true-end_false/',
      '/path-start_true-end_true/',
      '/path-start_false-end_false/',
      '/path-start_false-end_true/',
      '/path-end_false/index/',
      '/path-end_true/index/',
      '/path-also-ending-with-index/'
    ])
  })

  test('normalizePath { empty: false }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { empty: false }))

    expect(outputs).toEqual([
      '',
      '/path-start_true-end_false/',
      '/path-start_true-end_true/',
      '/path-start_false-end_false/',
      '/path-start_false-end_true/',
      '/path-end_false/index/',
      '/path-end_true/index/',
      '/path-also-ending-with-index/'
    ])
  })

  test('normalizePath { end: false }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { end: false }))

    expect(outputs).toEqual([
      '/',
      '/path-start_true-end_false',
      '/path-start_true-end_true',
      '/path-start_false-end_false',
      '/path-start_false-end_true',
      '/path-end_false/index',
      '/path-end_true/index',
      '/path-also-ending-with-index'
    ])
  })

  test('normalizePath { start: false }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { start: false }))

    expect(outputs).toEqual([
      '',
      'path-start_true-end_false/',
      'path-start_true-end_true/',
      'path-start_false-end_false/',
      'path-start_false-end_true/',
      'path-end_false/index/',
      'path-end_true/index/',
      'path-also-ending-with-index/'
    ])
  })

  test('normalizePath { index: true }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { index: false }))

    expect(outputs).toEqual([
      '/',
      '/path-start_true-end_false/',
      '/path-start_true-end_true/',
      '/path-start_false-end_false/',
      '/path-start_false-end_true/',
      '/path-end_false/',
      '/path-end_true/',
      '/path-also-ending-with-index/'
    ])
  })

  test('normalizePath { index: true }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { index: true }))

    expect(outputs).toEqual([
      '/index/',
      '/path-start_true-end_false/index/',
      '/path-start_true-end_true/index/',
      '/path-start_false-end_false/index/',
      '/path-start_false-end_true/index/',
      '/path-end_false/index/',
      '/path-end_true/index/',
      '/path-also-ending-with-index/index/'
    ])
  })

  test('normalizePath { index: true, end: false }', () => {
    const outputs = normalizeInputs.map(i => normalize.normalizePath(i, { index: true, end: false }))

    expect(outputs).toEqual([
      '/index',
      '/path-start_true-end_false/index',
      '/path-start_true-end_true/index',
      '/path-start_false-end_false/index',
      '/path-start_false-end_true/index',
      '/path-end_false/index',
      '/path-end_true/index',
      '/path-also-ending-with-index/index'
    ])
  })

  test('normalizePathPrefix', () => {
    const prefixes = [
      '/my-prefix/',
      '/my-prefix',
      'my-prefix/',
      'my-prefix'
    ]

    const outputs = prefixes.map(normalize.normalizePathPrefix)

    expect(outputs).toEqual([
      '/my-prefix',
      '/my-prefix',
      '/my-prefix',
      '/my-prefix'
    ])
  })

  test('normalizePathSuffix { default opts }', () => {
    const prefixes = [
      '/my-suffix/',
      '/my-suffix',
      'my-suffix/',
      'my-suffix'
    ]

    const outputs = prefixes.map(i => normalize.normalizePathSuffix(i))

    expect(outputs).toEqual([
      'my-suffix/',
      'my-suffix/',
      'my-suffix/',
      'my-suffix/'
    ])
  })

  test('normalizePathSuffix { end: false }', () => {
    const prefixes = [
      '/my-suffix/',
      '/my-suffix',
      'my-suffix/',
      'my-suffix'
    ]

    const outputs = prefixes.map(i => normalize.normalizePathSuffix(i, false))

    expect(outputs).toEqual([
      'my-suffix',
      'my-suffix',
      'my-suffix',
      'my-suffix'
    ])
  })

  test('normalizeURL { default opts }', () => {
    const urls = [
      'https://nuxtjs.org/my-path/index',
      'https://nuxtjs.org/my-path#with-hash',
      'https://nuxtjs.org/my-path?with=query',
      'https://nuxtjs.org/my-path?with=query#and-hash'
    ]

    const outputs = urls.map(i => normalize.normalizeURL(i))

    expect(outputs).toEqual([
      '/my-path/',
      '/my-path/#with-hash',
      '/my-path/?with=query',
      '/my-path/?with=query#and-hash'
    ])
  })

  test('normalizeURL { base, end: false }', () => {
    const urls = [
      'https://nuxtjs.org/my-path/index/',
      'https://nuxtjs.org/my-path/#with-hash',
      'https://nuxtjs.org/my-path/?with=query',
      'https://nuxtjs.org/my-path/?with=query#and-hash'
    ]

    const outputs = urls.map(i => normalize.normalizeURL(i, {
      base: 'https://nuxt.js.org',
      end: false
    }))

    expect(outputs).toEqual([
      '/my-path',
      '/my-path#with-hash',
      '/my-path?with=query',
      '/my-path?with=query#and-hash'
    ])
  })

  test('normalizePaths <string>', () => {
    const input = '/my-path'
    expect(normalize.normalizePaths(input)).toEqual('/my-path/')
  })

  test('normalizePaths <array>', () => {
    const outputs = normalize.normalizePaths(normalizeInputs, { index: false })

    expect(outputs).toEqual([
      '/',
      '/path-start_true-end_false/',
      '/path-start_true-end_true/',
      '/path-start_false-end_false/',
      '/path-start_false-end_true/',
      '/path-end_false/',
      '/path-end_true/',
      '/path-also-ending-with-index/'
    ])
  })

  test('normalizePaths <object.keys>', () => {
    const inputs = {
      '/my-path': {},
      '/my-other-path/': {}
    }
    const outputs = normalize.normalizePaths(inputs)

    expect(outputs).toEqual({
      '/my-path/': {},
      '/my-other-path/': {}
    })
  })

  test('normalizePaths <object.children>', () => {
    const inputs = [
      {
        route: 'my-route',
        children: [
          '/my-path'
        ]
      }
    ]

    const outputs = normalize.normalizePaths(inputs)

    expect(outputs).toEqual([
      {
        route: 'my-route',
        children: [
          '/my-path/'
        ]
      }
    ])
  })
})
