import { parse } from 'path'
import graymatter from 'gray-matter'
import defu from 'defu'
import { walk, join, exists, readFile, trimEnd, routePath } from '../../utils'
import PromisePool from '../../pool'
import { indexKeys, defaultMetaSettings, maxSidebarDepth } from './constants'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

const trimSlash = str => trimEnd(str, '/')
const isIndexRE = new RegExp(`(^|/)(${indexKeys.join('|')})$`, 'i')

async function parseDoc(sourcePath, mdProcessor) {
  let raw = await readFile(this.options.srcDir, sourcePath)
  const { name: fileName } = parse(sourcePath)

  let meta
  if (raw.trimLeft().startsWith('---')) {
    const { content, data } = graymatter(raw)
    raw = content

    meta = defu(data, defaultMetaSettings)
  } else {
    meta = defu({}, defaultMetaSettings)
  }

  if (meta.sidebar === 'auto') {
    meta.sidebarDepth = maxSidebarDepth
  }

  const { toc, html: body } = await this.$press.docs.source.markdown.call(this, raw, mdProcessor)

  const title = await this.$press.docs.source.title.call(this, fileName, raw, toc)

  const source = {
    type: 'topic',
    title,
    body
  }

  source.path = fixIndex('/' + sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(isIndexRE, ''))

  return {
    toc: toc.filter(([level]) => level <= (meta.sidebarDepth + 1)),
    meta,
    source
  }
}

function fixIndex(path) {
  if (path === '/') {
    return '/index'
  }
  return path
}

export default async function ({ options }) {
  let srcRoot = join(
    this.options.srcDir,
    this.$press.docs.dir
  )

  if (!exists(srcRoot)) {
    srcRoot = this.options.srcDir
  }

  const jobs = await walk.call(this, srcRoot, (path) => {
    if (path.startsWith('pages')) {
      return false
    }
    return path.endsWith('.md')
  })

  const sidebars = {}
  const sources = {}
  const docs = {}

  const mdProcessor = await this.$press.docs.source.processor()

  const handler = async (path) => {
    const { meta, toc, source } = await parseDoc.call(this, path, mdProcessor)

    const sourcePath = routePath(source.path) || '/'

    if (meta.sidebar === 'auto') {
      sidebars[sourcePath] = toc
    }

    docs[sourcePath] = { meta, toc }
    sources[sourcePath] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  let $sidebar
  if (Array.isArray(options.docs.sidebar)) {
    $sidebar = { '/': options.docs.sidebar }
  } else {
    $sidebar = options.docs.sidebar
  }

  const docPrefix = trimSlash(options.docs.prefix)

  for (const path in $sidebar) {
    const sidebar = []
    for (let sourcePath of $sidebar[path]) {
      let title

      if (Array.isArray(sourcePath)) {
        [sourcePath, title] = sourcePath
      }

      if (typeof sourcePath === 'object') {
        sidebar.push([1, sourcePath.title])

        if (sourcePath.children) {
          for (sourcePath of sourcePath.children) {
            sourcePath = sourcePath.replace(/.md$/i, '')
            sourcePath = trimSlash(`${docPrefix}${sourcePath}`)

            if (docs[sourcePath]) {
              const { meta, toc: [first, ...toc] } = docs[sourcePath]

              if (!title && meta.title) {
                title = meta.title
              }

              if (first) {
                sidebar.push([2, title || first[1], sourcePath])
              }

              sidebar.push(...toc.map(([level, name, url]) => [
                level + 1,
                name,
                url ? `${sourcePath}${url}` : url
              ]))
            }
          }
        }

        continue
      }

      if (sourcePath !== '/') {
        sourcePath = trimSlash(`${docPrefix}${sourcePath}`)
      }

      if (docs[sourcePath]) {
        const { meta, toc: [first, ...toc] } = docs[sourcePath]

        if (!title && meta.title) {
          title = meta.title
        }

        if (first) {
          sidebar.push([1, title || first[1], sourcePath])
        }

        sidebar.push(...toc.map(([level, name, url]) => [
          level,
          name,
          url ? `${sourcePath}${url}` : url
        ]))
      }
    }
    sidebars[path] = sidebar
  }

  return {
    options: {
      $sidebars: sidebars
    },
    sources
  }
}
