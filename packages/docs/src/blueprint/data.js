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
  createJobsFromConfig,
  normalizeSourcePath,
  normalizePath,
  PromisePool
} from '@nuxtpress/utils'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

export async function _parsePage ({ root, prefix: pagePrefix = '', path: sourcePath }, mdProcessor) {
  const src = sourcePath

  pagePrefix = normalizePath(pagePrefix, true, false, true)
  let raw = await readFileAsync(path.join(root, sourcePath), { encoding: 'utf8' })
  const { name: fileName } = path.parse(sourcePath)

  const defaultMetaSettings = this.constructor.defaultConfig.metaSettings

  let meta
  if (raw.trimLeft().startsWith('---')) {
    const { content, data } = graymatter(raw)
    raw = content

    meta = defu(data, defaultMetaSettings)

    if (meta.sidebar === 'auto') {
      meta.sidebarDepth = this.constructor.defaultConfig.maxSidebarDepth
    }
  } else {
    meta = defu({}, defaultMetaSettings)
  }

  const { toc, html: body } = await this.config.source.markdown(raw, mdProcessor)

  const title = await this.config.source.title(fileName, raw, toc)

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
    path: `${this.config.prefix}${pagePrefix}${urlPath}`,
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

export default async function docsData () {
  const jobs = await createJobsFromConfig(this.nuxt.options, this.config)

  const pages = {}
  const sources = {}
  const mdProcessor = await this.config.source.processor()

  const parsePage = _parsePage.bind(this)
  const handler = async (page) => {
    const { toc, meta, source } = await parsePage(page, mdProcessor)

    // Clarification:
    // - source.path is the full webpath including configured prefix
    // - sourcePath is the path without prefix
    // This is to make it easier to eg match sidebar stuff which
    // is based on paths without prefiex
    const sourcePath = normalizeSourcePath(source.path, this.config.prefix) || '/'

    this.nuxt.callHook('press:docs:page', {
      toc,
      meta,
      sourcePath,
      source
    })

    pages[sourcePath] = {
      meta,
      toc
    }
    sources[sourcePath] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  return {
    pages,
    sources
  }
}
