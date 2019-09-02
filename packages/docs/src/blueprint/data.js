import path from 'path'
import defu from 'defu'
import graymatter from 'gray-matter'
import {
  indexKeysRE,
  walk,
  existsAsync,
  readFileAsync,
  escapeChars,
  getDirsAsArray,
  normalizeSourcePath,
  normalizePath,
  PromisePool
} from '@nuxtpress/utils'

// TODO: move this


const defaultDir = 'docs'
const defaultPrefix = '/docs/'

const maxSidebarDepth = 2

const defaultMetaSettings = {
  sidebarDepth: 1
}


// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

export async function parsePage ({ root, prefix: pagePrefix = '', path: sourcePath }, mdProcessor) {
  const src = sourcePath

  pagePrefix = normalizePath(pagePrefix, true, false, true)
  let raw = await readFileAsync(path.join(root, sourcePath), { encoding: 'utf8' })
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

  const { toc, html: body } = await this.config.source.markdown.call(this, raw, mdProcessor)

  const title = await this.config.source.title.call(this, fileName, raw, toc)

  sourcePath = sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(indexKeysRE, '') || 'index'

  const urlPath = sourcePath === 'index' ? '/' : `/${sourcePath.replace(/\/index$/, '')}/`

  let locale = ''
  const locales = this.config.locales
  if (locales) {
    ({ code: locale } = locales.find(l => l.code === sourcePath || sourcePath.startsWith(`${l.code}/`)) || {})
  }

  const source = {
    type: 'topic',
    locale,
    title,
    body, /*: body.replace(/(<code[^>]*>)([\s\S]+?)(<\/code>)/gi, (_, m1, m2, m3) => `${m1}${m2.replace(/{{/g, '{\u200B{')}${m3}`),/**/
    path: `${this.config.$normalizedPrefix || ''}${pagePrefix}${urlPath}`,
    ...this.nuxt.options.dev && { src }
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

export default async function () {
  const srcRoots = getDirsAsArray(this.config.dir)
  for (const key in srcRoots) {
    if (!await existsAsync(this.nuxt.options.srcDir, srcRoots[key])) {
      // eslint-disable-next-line no-console
      console.warn(`Source Folder ${srcRoots[key]} doesnt exist, ignoring it`)
      srcRoots.splice(key, 1)
    }
  }

  if (!srcRoots.length) {
    srcRoots.push(this.nuxt.options.srcDir)
  }

  let srcPrefixes = null
  if (typeof this.config.dir === 'object') {
    srcPrefixes = this.config.dir
  }

  const jobs = []
  for (const srcRoot of srcRoots) {
    const srcPath = path.join(this.nuxt.options.srcDir, srcRoot)
    const validate = (path) => {
      // ignore pages folder
      if (path.startsWith(this.nuxt.options.dir.pages)) {
        return false
      }

      return path.endsWith('.md')
    }

    const paths = await walk(srcPath, { validate })

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
  const mdProcessor = await this.config.source.processor()

  const handler = async (page) => {
    const { toc, meta, source } = await parsePage.call(this, page, mdProcessor)

    // Clarification:
    // - source.path is the full webpath including configured prefix
    // - sourcePath is the path without prefix
    // This is to make it easier to eg match sidebar stuff which
    // is based on paths without prefiex
    const sourcePath = normalizeSourcePath(source.path, this.config.$normalizedPrefix) || '/'

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

  this.config.$pages = $pages

  // TODO: should this logic need to be moved somewhere else
  this.config.$asJsonTemplate = new Proxy({}, {
    get (_, prop) {
      let val = this.config[prop] || this.config[`$${prop}`]

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
    sources
  }
}
