import path from 'path'
import graymatter from 'gray-matter'
import defu from 'defu'
import { walk, join, exists, readFile, routePath, escapeChars } from '../../utils'
import PromisePool from '../../pool'
import { indexKeys, defaultMetaSettings, maxSidebarDepth } from './constants'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

const isIndexRE = new RegExp(`(^|/)(${indexKeys.join('|')})$`, 'i')

async function parsePage (sourcePath, mdProcessor) {
  let raw = await readFile(this.options.srcDir, sourcePath)
  const { name: fileName } = path.parse(sourcePath)

  let meta
  if (raw.trimLeft().startsWith('---')) {
    const { content, data } = graymatter(raw)
    raw = content

    meta = defu(data, defaultMetaSettings)

    if (meta.sidebar === 'auto') {
      meta.sidebarDepth = maxSidebarDepth
    }
  } else {
    meta = defu({}, defaultMetaSettings)
  }

  const { toc, html: body } = await this.$press.docs.source.markdown.call(this, raw, mdProcessor)

  const title = await this.$press.docs.source.title.call(this, fileName, raw, toc)

  const source = {
    type: 'topic',
    title,
    body
  }

  sourcePath = sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(isIndexRE, '')
  source.path = `/${sourcePath || 'index'}`

  return {
    toc: toc.map((h) => {
      if (h[2].substr(0, 1) === '#') {
        h[2] = `/${sourcePath}${h[2]}`
      }

      return h
    }),
    meta,
    source
  }
}

export default async function ({ options: { docs: docOptions } }) {
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

  const sources = {}
  const $pages = {}

  const mdProcessor = await this.$press.docs.source.processor()

  const handler = async (path) => {
    const { toc, meta, source } = await parsePage.call(this, path, mdProcessor)

    const sourcePath = routePath(source.path) || '/'

    $pages[sourcePath] = { meta, toc }
    sources[sourcePath] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  const options = { $pages }

  options.$asJsonTemplate = new Proxy({}, {
    get (target, prop) {
      let val = options[prop] || options[`$${prop}`] || docOptions[prop]

      if (prop === 'nav') {
        val = val.map((link) => {
          const keys = Object.keys(link)
          if (keys.length > 1) {
            return link
          } else {
            return {
              text: keys[0],
              link: Object.values(link)[0]
            }
          }
        })
      }

      if (val) {
        const jsonStr = JSON.stringify(val, null, 2)
        return escapeChars(jsonStr, '`')
      }

      return val
    }
  })

  return {
    options,
    sources
  }
}
