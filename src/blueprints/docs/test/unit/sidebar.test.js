import { tocToTree, createSidebarFromToc } from '../../sidebar'

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

    const sidebar = createSidebarFromToc(path, title, page)
    expect(sidebar).toEqual([[1, 'Level 1', '/path2/']])
  })

  test('adds page title when no toc', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {},
      toc: []
    }

    const sidebar = createSidebarFromToc(path, title, page)
    expect(sidebar).toEqual([[
      1, 'Level 1', '/path/'
    ]])
  })

  test('adds path as title as fallback', () => {
    const path = '/path'
    const title = ''
    const page = {
      meta: {},
      toc: []
    }

    const sidebar = createSidebarFromToc(path, title, page)
    expect(sidebar).toEqual([[
      1, '/path', '/path/'
    ]])
  })

  test('auto adds page when no level 1', () => {
    const path = '/path'
    const title = 'Level 1'
    const page = {
      meta: {},
      toc: [[2, 'Level 2', '/path/sub']]
    }

    const sidebar = createSidebarFromToc(path, title, page)
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

    const sidebar = createSidebarFromToc(path, title, page)
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

    const sidebar = createSidebarFromToc(path, title, page)
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

    const sidebar = createSidebarFromToc(path, title, page)
    expect(sidebar).toEqual([
      [1, 'Level 1', '/path/', [
        [3, 'Level 3', '/path/sub/sub/', [
          [4, 'Level 4', '/path/sub/sub/sub/']
        ]]
      ]]
    ])
  })
})
