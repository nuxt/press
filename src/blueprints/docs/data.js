import path from 'path'
import graymatter from 'gray-matter'
import defu from 'defu'
import { walk, join, exists, readFile, routePath, escapeChars, trimSlash } from '../../utils'
import PromisePool from '../../pool'
import { indexKeys, defaultMetaSettings, maxSidebarDepth } from './constants'
import { normalizePaths, tocToTree, createSidebar } from './sidebar'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

const isIndexRE = new RegExp(`(^|/)(${indexKeys.join('|')})$`, 'i')

export async function parsePage (sourcePath, mdProcessor) {
  const src = sourcePath
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

  sourcePath = sourcePath.substr(0, sourcePath.lastIndexOf('.')).replace(isIndexRE, '') || 'index'

  const urlPath = sourcePath === 'index' ? '/' : `/${sourcePath.replace(/\/index$/, '')}/`

  let locale = ''
  const locales = this.$press.i18n && this.$press.i18n.locales
  if (locales) {
    ({ code: locale } = locales.find(l => l.code === sourcePath || sourcePath.startsWith(`${l.code}/`)) || {})
  }

  const source = {
    type: 'topic',
    locale,
    title,
    body,
    path: `${trimSlash(this.$press.docs.prefix)}${urlPath}`,
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
  const prefix = trimSlash(this.$press.docs.prefix)

  const handler = async (path) => {
    const { toc, meta, source } = await parsePage.call(this, path, mdProcessor)

    const sourcePath = routePath(source.path, prefix) || '/'

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

  const options = {
    $pages,
    $prefix: trimSlash(this.$press.docs.prefix || '')
  }
  const press = this.$press

  // TODO: should this logic need to be moved somewhere else
  options.$asJsonTemplate = new Proxy({}, {
    get (_, prop) {
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
      } else if (prop === 'pages') {
        val = {}
        // only export the minimum of props we need
        for (const path in options.$pages) {
          const page = options.$pages[path]
          const [toc = []] = page.toc || []

          val[path] = {
            title: page.meta.title || toc[1] || '',
            hash: (toc[2] && toc[2].substr(path.length)) || '',
            meta: page.meta
          }
        }
      } else if (prop === 'sidebars') {
        let createSidebarForEachLocale = false
        const hasLocales = !!(press.i18n && press.i18n.locales)

        let sidebarConfig = press.docs.sidebar
        if (typeof sidebarConfig === 'string') {
          sidebarConfig = [sidebarConfig]
        }

        if (Array.isArray(sidebarConfig)) {
          createSidebarForEachLocale = hasLocales
          sidebarConfig = {
            '/': sidebarConfig
          }
        }

        let routePrefixes = ['']
        if (createSidebarForEachLocale) {
          routePrefixes = press.i18n.locales.map(locale => `/${typeof locale === 'object' ? locale.code : locale}`)
        }

        const sidebars = {}
        for (const routePrefix of routePrefixes) {
          for (const path in sidebarConfig) {
            const normalizedPath = normalizePaths(path)

            const sidebarPath = `${routePrefix}${normalizedPath}`

            sidebars[sidebarPath] = createSidebar(
              sidebarConfig[path].map(normalizePaths),
              options.$pages,
              routePrefix
            )
          }
        }

        for (const path in options.$pages) {
          const page = options.$pages[path]
          if (page.meta && page.meta.sidebar === 'auto') {
            sidebars[path] = tocToTree(page.toc)
          }
        }

        val = sidebars
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
