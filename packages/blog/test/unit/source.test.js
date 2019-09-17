import source from '../../src/blueprint/source'

describe('source.metadata', () => {
  test('missing date', () => {
    expect(() => source.metadata('', 'x.md'))
      .toThrow('Missing or invalid publication date in x.md -- see documentation at https://nuxt.press')
  })

  test('with date', () => {
    const raw = `---
date: 2019-09-16
title: x
---`
    expect(source.metadata(raw, 'x.md').meta)
      .toEqual({
        published: new Date(Date.parse('2019-09-16')),
        title: 'x'
      })
  })

  test('with start date', () => {
    const raw = `June 20, 2019
# title`

    expect(source.metadata(raw, 'x.md').meta)
      .toEqual({
        published: new Date(Date.parse('June 20, 2019'))
      })
  })
})

describe('source.path', () => {
  test('with title', () => {
    const data = {
      title: 'Suppa Doctor',
      published: new Date(Date.parse('June 20, 2019'))
    }

    expect(source.path('post.md', data))
      .toEqual('2019/jun/20/suppa-doctor/')
  })

  test('without title', () => {
    const data = {
      published: new Date(Date.parse('June 01, 2019'))
    }

    expect(source.path('post', data))
      .toEqual('2019/jun/01/post/')
  })
})

describe('source.title', () => {
  test('with title', () => {
    const body = `
    # Suppaman the Hero
    ## Non title
    ## Non Title 2`

    expect(source.title(body))
      .toEqual('Suppaman the Hero')
  })

  test('without title', () => {
    const body = `
    ## Suppaman the Hero
    ## Non title
    ## Non Title 2`

    expect(source.title(body))
      .toEqual('')
  })
})

test('source.id', () => {
  const data = { published: new Date(Date.parse('2019-09-16')), path: '/my/blog/post-x' }
  const context = {
    config: {
      feed: {
        tagDomain: 'domamain.com'
      }
    }
  }

  expect(source.id.call(context, data))
    .toEqual('tag:domamain.com,2019:/my/blog/post-x')
})
