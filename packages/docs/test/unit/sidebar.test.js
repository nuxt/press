import {
  tocToTree,
  extractPagePaths,
  createSidebarFromToc,
  createSidebarFromRegex,
  createSidebar
} from '../../src/sidebar'

describe('tocToTree', () => {
  test('normal tree', () => {
    const toc = [
      [1, 'level 1', ''],
      [2, 'level 2', ''],
      [3, 'level 3', ''],
      [4, 'level 4', ''],
      [5, 'level 5', ''],
      [6, 'level 6', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(1)
    expect(tree[0][3].length).toBe(1)
    expect(tree[0][3][0][3].length).toBe(1)
    expect(tree[0][3][0][3][0][3].length).toBe(1)
    expect(tree[0][3][0][3][0][3][0][3].length).toBe(1)
    expect(tree[0][3][0][3][0][3][0][3][0][3].length).toBe(1)
    expect(tree[0][3][0][3][0][3][0][3][0][3][0][3]).toBeUndefined()
  })

  test('no level 1', () => {
    const toc = [
      [2, 'level 2', ''],
      [2, 'level 2', ''],
      [2, 'level 2', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(3)
  })

  test('additional level 1', () => {
    const toc = [
      [1, 'level 1', ''],
      [3, 'level 2', ''],
      [6, 'level 3', ''],
      [1, 'level 1', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(2)
    expect(tree[0][3].length).toBe(1)
    expect(tree[1][3]).toBeFalsy()
    expect(tree[0][3][0][3].length).toBe(1)
  })

  test('two trees', () => {
    const toc = [
      [1, 'level 1', ''],
      [2, 'level 2', ''],
      [3, 'level 3', ''],
      [1, 'level 1', ''],
      [2, 'level 2', ''],
      [3, 'level 3', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(2)
    expect(tree[0][3].length).toBe(1)
    expect(tree[0][3][0][3].length).toBe(1)
    expect(tree[1][3].length).toBe(1)
    expect(tree[1][3][0][3].length).toBe(1)
  })

  test('recursive tree', () => {
    const toc = [
      [6, 'level 6', ''],
      [3, 'level 3', ''],
      [1, 'level 1', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(3)
  })

  test('start from upper then tree with gap', () => {
    const toc = [
      [6, 'level 6', ''],
      [1, 'level 1', ''],
      [6, 'level 6', '']
    ]

    const tree = tocToTree(toc)
    expect(tree.length).toBe(2)
    expect(tree[0][3]).toBeFalsy()
    expect(tree[1][3].length).toBe(1)
  })
})

describe('createSidebarFromToc', () => {
  test('normal', () => {
    const path = '/path1'
    const title = ''
    const page = {
      meta: {},
      toc: [[1, 'Level 1', '/path2']]
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[1, 'Level 1', '/path2/']])
  })

  test('no error when no page', () => {
    const path = '/path1'
    const title = ''
    const page = null

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([])
  })

  test('adds page title when no toc', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {},
      toc: []
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'Level 1', '/path/'
    ]])
  })

  test('adds page.meta title when no toc', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {
        title: 'My Title'
      },
      toc: []
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'My Title', '/path/'
    ]])
  })

  test('adds path as title as fallback', () => {
    const path = '/path'
    const title = ''
    const page = {
      meta: {},
      toc: []
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, '/path', '/path/'
    ]])
  })

  test('sets home title when no other title', () => {
    const path = '/path'
    const title = ''
    const page = {
      meta: {
        home: true
      },
      toc: []
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'Home', '/path/'
    ]])
  })

  test('auto adds page when no level 1', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {},
      toc: [[2, 'Level 2', '/path/sub']]
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'Level 1', '/path/', [
        [2, 'Level 2', '/path/sub/']
      ]
    ]])
  })

  test('can skip level in toc (meta.sidebarSkipLevel)', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {
        sidebarSkipLevel: 2
      },
      toc: [
        [1, 'Level 1', '/path'],
        [2, 'Level 2', '/path/sub'],
        [3, 'Level 3', '/path/sub/sub']
      ]
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'Level 1', '/path/', [
        [3, 'Level 3', '/path/sub/sub/']
      ]
    ]])
  })

  test('can skip levels in toc (meta.sidebarSkipLevels)', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {
        sidebarSkipLevels: [2, 3]
      },
      toc: [
        [1, 'Level 1', '/path'],
        [2, 'Level 2', '/path/sub'],
        [3, 'Level 3', '/path/sub/sub'],
        [4, 'Level 4', '/path/sub/sub/sub']
      ]
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([[
      1, 'Level 1', '/path/', [
        [4, 'Level 4', '/path/sub/sub/sub/']
      ]
    ]])
  })

  test('can limit skip levels in toc (meta.sidebarSkipCount)', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {
        sidebarSkipLevels: [2, 3],
        sidebarSkipCount: 1
      },
      toc: [
        [1, 'Level 1', '/path'],
        [2, 'Level 2', '/path/sub'],
        [3, 'Level 3', '/path/sub/sub'],
        [4, 'Level 4', '/path/sub/sub/sub']
      ]
    }

    const sidebar = createSidebarFromToc(path, page, title)
    expect(sidebar).toEqual([
      [1, 'Level 1', '/path/', [
        [3, 'Level 3', '/path/sub/sub/', [
          [4, 'Level 4', '/path/sub/sub/sub/']
        ]]
      ]]
    ])
  })
})

describe('normalizePagePaths', () => {
  test('normal', () => {
    const pages = {
      '/b/': {},
      '/aa/': {}
    }

    expect(extractPagePaths(pages)).toEqual([
      '/aa/',
      '/b/'
    ])
  })

  test('similar paths sorts correctly', () => {
    const pages = {
      '/path-long/': {},
      '/path/': {}
    }

    expect(extractPagePaths(pages)).toEqual([
      '/path/',
      '/path-long/'
    ])
  })

  test('filters route prefixes', () => {
    const pages = {
      '/a/path/': {},
      '/b/path/': {}
    }

    expect(extractPagePaths(pages, '/a')).toEqual([
      '/a/path/'
    ])
  })
})

describe('createSidebarFromRegex', () => {
  test('normal', () => {
    const toc = [
      [1, 'Title', '/path/']
    ]
    const pages = {
      '/path/': {
        meta: {},
        toc: [].concat(toc)
      }
    }

    const pathOrRegex = '/path/'
    const routePrefix = ''

    const sidebar = createSidebarFromRegex(pathOrRegex, routePrefix, extractPagePaths(pages, routePrefix), pages)
    expect(sidebar).toEqual(toc)
  })

  test('glob', () => {
    const tocs = [
      [1, 'Path', '/path/'],
      [1, 'Path One', '/path-one/'],
      [1, 'Path Two', '/path-two/sub/']
    ]
    const pages = {
      '/path/': {
        meta: {},
        toc: [[].concat(tocs[0])]
      },
      '/path-one/': {
        meta: {},
        toc: [[].concat(tocs[1])]
      },
      '/path-two/sub/': {
        meta: {},
        toc: [[].concat(tocs[2])]
      }
    }

    const pathOrRegex = '/path-*/'
    const routePrefix = ''

    const sidebar = createSidebarFromRegex(pathOrRegex, routePrefix, extractPagePaths(pages, routePrefix), pages)
    expect(sidebar).toEqual([tocs[1], tocs[2]])
  })

  test('regex', () => {
    const tocs = [
      [1, 'Path', '/path/'],
      [1, 'Path One', '/path-sub/'],
      [1, 'Path Two', '/path-two/sub/']
    ]
    const pages = {
      '/path/': {
        meta: {},
        toc: [[].concat(tocs[0])]
      },
      '/path-sub/': {
        meta: {},
        toc: [[].concat(tocs[1])]
      },
      '/path-two/sub/': {
        meta: {},
        toc: [[].concat(tocs[2])]
      }
    }

    const pathOrRegex = 'path-[^/]+/sub(.*)'
    const routePrefix = ''

    const sidebar = createSidebarFromRegex(pathOrRegex, routePrefix, extractPagePaths(pages, routePrefix), pages)
    expect(sidebar).toEqual([tocs[2]])
  })

  test('glob with route prefix', () => {
    const tocs = [
      [1, 'Path', '/prefix/path/'],
      [1, 'Path One', '/path-one/'],
      [1, 'Path Two', '/path-two/sub/']
    ]
    const pages = {
      '/prefix/path/': {
        meta: {},
        toc: [[].concat(tocs[0])]
      },
      '/path-one/': {
        meta: {},
        toc: [[].concat(tocs[1])]
      },
      '/path-two/sub/': {
        meta: {},
        toc: [[].concat(tocs[2])]
      }
    }

    const pathOrRegex = 'path*'
    const routePrefix = '/prefix'

    const sidebar = createSidebarFromRegex(pathOrRegex, routePrefix, extractPagePaths(pages, routePrefix), pages)
    expect(sidebar).toEqual([tocs[0]])
  })
})

describe('createSidebar', () => {
  test('full', () => {
    const tocs = [
      [1, 'Path One', '/path-one/'],
      [1, 'Path Two', '/path-two/'],
      [1, 'Path Three', '/path-three/'],
      [1, 'Path Four', '/path-four/']
    ]
    const pages = {
      '/path-one/': {
        meta: {},
        toc: [[].concat(tocs[0])]
      },
      '/path-two/': {
        meta: {},
        toc: [[].concat(tocs[1])]
      },
      '/path-three/': {
        meta: {},
        toc: [[].concat(tocs[2])]
      },
      '/path-four/': {
        meta: {},
        toc: [[].concat(tocs[3])]
      }
    }

    const routePrefix = ''
    const sidebarConfig = [
      '/path-three/',
      ['/path-two/', 'My Title'],
      ['/outside-path/', 'Outside'],
      {
        title: 'Group',
        children: [
          '/path-one/',
          ['/path-four/', 'My Title Again'],
          ['/another-outside/', 'Another']
        ]
      }
    ]

    const sidebar = createSidebar(sidebarConfig, pages, routePrefix)
    expect(sidebar).toEqual([
      [1, 'Path Three', '/path-three/'],
      [1, 'My Title', '/path-two/'],
      [1, 'Outside', '/outside-path/'],
      [1, 'Group', '', [
        [2, 'Path One', '/path-one/'],
        [2, 'My Title Again', '/path-four/'],
        [2, 'Another', '/another-outside/']
      ]]
    ])
  })

  test('not localized sidebar', () => {
    const tocs = [
      [1, 'Path EN', '/en/'],
      [1, 'Sub Path EN', '/en/sub/'],
      [1, 'Path NL', '/nl/'],
      [1, 'Sub Path NL', '/nl/sub/']
    ]
    const pages = {
      '/en/': {
        meta: {},
        toc: [[].concat(tocs[0])]
      },
      '/en/sub/': {
        meta: {},
        toc: [[].concat(tocs[1])]
      },
      '/nl/': {
        meta: {},
        toc: [[].concat(tocs[2])]
      },
      '/nl/sub/': {
        meta: {},
        toc: [[].concat(tocs[3])]
      }
    }

    const sidebarConfig = [
      '/',
      '/sub/'
    ]

    const sidebarEN = createSidebar(sidebarConfig, pages, '/en')
    expect(sidebarEN).toEqual([
      [1, 'Path EN', '/en/'],
      [1, 'Sub Path EN', '/en/sub/']
    ])

    const sidebarNL = createSidebar(sidebarConfig, pages, '/nl')
    expect(sidebarNL).toEqual([
      [1, 'Path NL', '/nl/'],
      [1, 'Sub Path NL', '/nl/sub/']
    ])
  })
})
