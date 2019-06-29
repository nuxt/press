import { parse } from 'path'
import graymatter from 'gray-matter'
import { walk, join, exists, readFile, trimEnd } from '../../utils'
import PromisePool from '../../pool'
import { indexKeys } from './constants'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

const trimSlash = str => trimEnd(str, '/')
const isIndexRE = new RegExp(`/(${indexKeys.join('|')})$`, 'i')

async function parseDoc(sourcePath) {
  let raw = await readFile(this.options.srcDir, sourcePath)
  const { name: fileName } = parse(sourcePath)

  let meta = {}
  if (raw.trimLeft().startsWith('---')) {
    const { content, data } = graymatter(raw)
    raw = content
    meta = data
  }

  const { toc, html: body } = await this.$press.docs.source.markdown.call(this, raw)
  const title = this.$press.docs.source.title.call(this, fileName, raw)

  const source = {
    type: 'topic',
    title,
    body
  }

  source.path = '/' + sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(isIndexRE, '')

  return {
    toc,
    meta,
    source
  }
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

  const handler = async (path) => {
    const { meta, toc, source } = await parseDoc.call(this, path)

    const sourcePath = source.path

    if (![0, false].includes(meta.sidebar)) {
      sidebars[sourcePath] = toc
    }

    docs[sourcePath] = { meta, toc }
    sources[sourcePath] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()
  // console.log(sources, index)

  if (Array.isArray(options.docs.sidebar)) {
    options.docs.sidebar = {
      '/': options.docs.sidebar
    }
  }

  const docPrefix = trimSlash(options.docs.prefix)

  for (const path in options.docs.sidebars) {
    const sidebar = []

    options.docs.sidebar[path].forEach((sourcePath) => {
      let title

      if (Array.isArray(sourcePath)) {
        [sourcePath, title] = sourcePath
      }

      if (typeof sourcePath === 'object') {
        // todo
      }

      sourcePath = trimSlash(`${docPrefix}${sourcePath}`)

      if (docs[sourcePath]) {
        const { meta, toc } = docs[sourcePath]

        if (!title && meta.title) {
          title = meta.title
        }

        const first = toc.shift()
        sidebar.push([1, title || first[1], sourcePath])

        Array.prototype.push.apply(sidebar, toc.map((t) => {
          t[2] = `${sourcePath}${t[2]}`
          return t
        }))
      }
    })

    sidebars[path] = sidebar
  }

  console.log('sidebars', sidebars)

  return {
    options: {
      sidebars
    },
    sources
  }
}
