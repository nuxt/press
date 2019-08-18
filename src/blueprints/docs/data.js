import path from 'path'
import graymatter from 'gray-matter'
import defu from 'defu'
import { walk, join, exists, readFile, routePath, escapeChars, getDirsAsArray, normalizePath } from '../../utils'
import PromisePool from '../../pool'
import { indexKeys, defaultMetaSettings, maxSidebarDepth } from './constants'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

const isIndexRE = new RegExp(`(^|/)(${indexKeys.join('|')})$`, 'i')

export async function parsePage ({ rootOptions, id, options }, { root, prefix: pagePrefix = '', path: sourcePath }, mdProcessor) {
  const src = sourcePath

  pagePrefix = normalizePath(pagePrefix, true, false, true)

  let raw = await readFile(join(root, sourcePath))
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

  const { toc, html: body } = await options.source.markdown.call(this, raw, mdProcessor)

  const title = await options.source.title.call(this, fileName, raw, toc)

  sourcePath = sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(isIndexRE, '') || 'index'

  const urlPath = sourcePath === 'index' ? '/' : `/${sourcePath.replace(/\/index$/, '')}/`

  let locale = ''
  const locales = rootOptions.i18n && rootOptions.i18n.locales
  if (locales) {
    ({ code: locale } = locales.find(l => l.code === sourcePath || sourcePath.startsWith(`${l.code}/`)) || {})
  }

  const source = {
    type: 'topic',
    locale,
    title,
    body,
    path: `${options.$normalizedPrefix}${pagePrefix}${urlPath}`,
    ...this.options.dev && { src }
  }

  return {
    toc: toc.map((h) => {
      if (h[2].substr(0, 1) === '#') {
        h[2] = `${urlPath}${h[2]}`
      }

      return h
    }),
    meta,
    source
  }
}

export default async function (context) {
  const { options } = context

  const srcRoots = getDirsAsArray(options.dir)
  for (const key in srcRoots) {
    if (!exists(this.options.srcDir, srcRoots[key])) {
      // eslint-disable-next-line no-console
      console.warn(`Source Folder ${srcRoots[key]} doesnt exist, ignoring it`)
      srcRoots.splice(key, 1)
    }
  }

  if (!srcRoots.length) {
    srcRoots.push(this.options.srcDir)
  }

  let srcPrefixes = null
  if (typeof options.dir === 'object') {
    srcPrefixes = options.dir
  }

  const jobs = []
  for (const srcRoot of srcRoots) {
    const srcPath = join(this.options.srcDir, srcRoot)
    const paths = await walk.call(this, srcPath, (path) => {
      // ignore pages folder
      if (path.startsWith(this.options.dir.pages)) {
        return false
      }

      return path.endsWith('.md')
    }, true)

    jobs.push(...paths.map((path) => {
      let prefix = ''
      if (srcPrefixes && srcPrefixes[srcRoot]) {
        prefix = srcPrefixes[srcRoot]
      }

      return {
        root: srcPath,
        prefix,
        path
      }
    }))
  }

  const sources = {}
  const $pages = {}
  const mdProcessor = await options.source.processor()

  const handler = async (page) => {
    const { toc, meta, source } = await parsePage.call(this, context, page, mdProcessor)

    // Clarification:
    // - source.path is the full webpath including configured prefix
    // - sourcePath is the path without prefix
    // This is to make it easier to eg match sidebar stuff which
    // is based on paths without prefiex
    const sourcePath = routePath(source.path, options.$normalizedPrefix) || '/'

    this.nuxt.callHook('press:docs:page', {
      toc,
      meta,
      sourcePath,
      source
    })

    $pages[sourcePath] = {
      meta,
      toc
    }
    sources[sourcePath] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  options.$pages = $pages

  // TODO: should this logic need to be moved somewhere else
  options.$asJsonTemplate = new Proxy({}, {
    get (_, prop) {
      let val = options[prop] || options[`$${prop}`]

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
    options: {},
    sources
  }
}
