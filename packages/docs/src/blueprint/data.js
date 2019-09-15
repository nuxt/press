import path from 'path'
import { walk } from '@nuxt/blueprints'
import {
  readTextFile,
  getDirsAsArray,
  createJobsFromConfig,
  filePathToWebpath,
  PromisePool
} from '@nuxt-press/utils'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

export async function _parsePage ({ root, prefix = '', path: sourcePath }, mdProcessor) {
  let raw = await readTextFile(root, sourcePath)

  const { content, meta } = this.config.source.metadata(raw)
  const { toc, html: body } = await this.config.source.markdown(content || raw, mdProcessor)
  const title = await this.config.source.title(body, sourcePath, toc)
  const webpath = filePathToWebpath(sourcePath, { prefix })

  let locale = ''
  const locales = this.config.locales
  if (locales) {
    ({ code: locale } = locales.find(l => webpath.startsWith(`/${l.code}/`)) || {})
  }

  const source = {
    type: 'topic',
    locale,
    title,
    body,
    src: this.nuxt.options.dev ? path.join(root, prefix, sourcePath) : undefined,
    path: `${this.config.prefix}${webpath}`,
  }

  return {
    toc: toc.map((h) => {
      // convert toc links to full but prefix-less urls
      if (h[2].substr(0, 1) === '#') {
        h[2] = `${webpath}${h[2]}`
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
    // is based on paths without prefix
    const sourcePath = source.path.slice(this.config.prefix.length)

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
