import { filePathToWebpath } from '../../src/route'

const fileInputs = [
  '/index.md',
  '/README.md',
  '/a-path.txt',
  '/sub.folder/sub.path.md'
]

describe('route', () => {
  test('normalizePath { default opts }', () => {
    const outputs = fileInputs.map(i => filePathToWebpath(i, { sep: '/' }))

    expect(outputs).toEqual([
      '/',
      '/',
      '/a-path/',
      '/sub.folder/sub.path/'
    ])
  })

  test('normalizePath { prefix: \'my-prefix\' }', () => {
    const outputs = fileInputs.map(i => filePathToWebpath(i, { sep: '/', prefix: 'my-prefix' }))

    expect(outputs).toEqual([
      '/my-prefix/',
      '/my-prefix/',
      '/my-prefix/a-path/',
      '/my-prefix/sub.folder/sub.path/'
    ])
  })

  test('normalizePath { extension: \'.md\' }', () => {
    const outputs = fileInputs.map(i => filePathToWebpath(i, { sep: '/', extension: '.md' }))

    expect(outputs).toEqual([
      '/',
      '/',
      '/a-path/',
      '/sub.folder/sub.path/'
    ])
  })

  test('normalizePath { strip: false }', () => {
    const outputs = fileInputs.map(i => filePathToWebpath(i, { sep: '/', strip: false }))

    expect(outputs).toEqual([
      '/index/',
      '/README/',
      '/a-path/',
      '/sub.folder/sub.path/'
    ])
  })

  test('normalizePath { windows separator }', () => {
    const fileInputs = [
      '\\index.md',
      '\\readme.md',
      '\\a-path.txt',
      '\\sub.folder\\sub.path.md'
    ]

    const outputs = fileInputs.map(i => filePathToWebpath(i, { sep: '\\' }))

    expect(outputs).toEqual([
      '/',
      '/',
      '/a-path/',
      '/sub.folder/sub.path/'
    ])
  })
})
