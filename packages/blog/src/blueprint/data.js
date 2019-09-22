import path from 'path'
import lodashTemplate from 'lodash/template'
import { exists, walk } from '@nuxt/blueprints'
import {
  readTextFile,
  normalizePath,
  createJobsFromConfig,
  PromisePool
} from '@nuxt-press/utils'

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

export async function _parseEntry ({ root, prefix = '', path: sourcePath }, mdProcessor) {
  const raw = await readTextFile(root, sourcePath)

  try {
    const { name: fileName } = path.parse(sourcePath)
    const { meta, content } = this.config.source.metadata(raw, fileName)

    const title = meta.title || this.config.source.title(content || raw)
    const slug = meta.slug
    const published = meta.published

    const body = await this.config.source.markdown(content || raw.substr(raw.indexOf('#')), mdProcessor)

    const source = {
      ...meta,
      type: 'entry',
      id: undefined,
      title,
      body,
      slug,
      path: undefined,
      published,
      ...this.nuxt.options.dev && { src: path.join(root, prefix, sourcePath) }
    }

    source.id = this.config.source.id(source)
    source.path = `${this.config.prefix}${normalizePath(this.config.source.path(fileName, source, meta))}`

    return source
  } catch (error) {
    console.warn(error)
  }
}

function addArchiveEntry (archive, entry) {
  const year = entry.published.getFullYear()
  const month = (entry.published.getMonth() + 1)
    .toString()
    .padStart(2, '0')

  if (!archive[year]) {
    archive[year] = {}
  }

  if (!archive[year][month]) {
    archive[year][month] = []
  }

  archive[year][month].push(entry)
}

async function generateFeed (entries) {
  // TODO: get 'press'/rootId from core?
  let srcPath = path.join(this.nuxt.options.srcDir, 'press', this.id, 'static', 'rss.xml')
  if (!await exists(srcPath)) {
    srcPath = path.join(__dirname, 'static', 'rss.xml')
  }
  const template = lodashTemplate(await readTextFile(srcPath))
  return template({ blog: this.config, entries })
}

function sortEntries (entries) {
  return entries
    .map(e => ({ ...e, $published: new Date(e.published) }))
    .sort((a, b) => (b.$published - a.$published))
    .map(({ $published, ...e }) => e)
}

export default async function blogData () {
  const sources = {}
  const archive = {}

  const parseEntry = _parseEntry.bind(this)
  const mdProcessor = await this.config.source.processor()
  const jobs = await createJobsFromConfig(this.nuxt.options, this.config)

  const handler = async (path) => {
    const entry = await parseEntry(path, mdProcessor)
    if (!entry) {
      return
    }

    addArchiveEntry(archive, entry)
    sources[entry.path] = entry
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  const index = sortEntries(Object.values(sources)).slice(0, 10)
    .map((entry, i) => {
      // Remove body from all but the latest entry
      if (i === 0) {
        return entry
      }
      return (({ body, ...rest }) => rest)(entry)
    })

  for (const year in archive) {
    for (const month in archive[year]) {
      archive[year][month] = sortEntries(archive[year][month])
        .map(({ body, id, ...entry }) => entry)
    }
  }

  if (typeof this.config.feed.path === 'function') {
    this.config.feed.path = this.config.feed.path(this.config)
  }

  return {
    static: {
      [this.config.feed.path]: (
        await generateFeed.call(this, index)
      )
    },
    topLevel: {
      [`${this.config.prefix}/index`]: index,
      [`${this.config.prefix}/archive`]: archive
    },
    sources
  }
}
