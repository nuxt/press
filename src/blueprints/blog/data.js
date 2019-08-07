
import { parse as parsePath } from 'path'
import consola from 'consola'
import lodashTemplate from 'lodash/template'
import { exists, walk, join, readFile } from '../../utils'
import resolve from '../../resolve'
import PromisePool from '../../pool'

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

export async function parseEntry (sourcePath, processor) {
  // TODO just completely rewrite this function, please
  const parse = this.$press.blog.source
  const fileName = parsePath(sourcePath).name
  const raw = await readFile(this.options.srcDir, sourcePath)
  const metadata = parse.metadata.call(this, fileName, raw)
  if (metadata instanceof Error) {
    consola.warn(metadata.message)
    return
  }
  const title = metadata.title || parse.title.call(this, raw)
  const slug = metadata.slug
  const body = await parse.markdown.call(this, metadata.content || raw.substr(raw.indexOf('#')), processor)
  const published = metadata.published
  delete metadata.content
  const source = { ...metadata, body, title, slug, published }
  source.path = `${this.$press.blog.prefix}${this.$press.blog.source.path.call(this, fileName, source)}`
  source.sourcePath = `${this.$press.blog.source.path.call(this, fileName, source)}`
  source.type = 'entry'
  source.id = this.$press.blog.source.id.call(this, source)
  if (this.options.dev) {
    source.src = sourcePath
  }
  return source
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

async function generateFeed (options, entries) {
  let srcPath = join(this.options.srcDir, 'press', 'blog', 'static', 'rss.xml')
  if (!exists(srcPath)) {
    srcPath = resolve('blueprints', 'blog', 'templates', 'static', 'rss.xml')
  }
  const template = lodashTemplate(await readFile(srcPath))
  return template({ blog: options, entries })
}

function sortEntries (entries) {
  return entries
    .map(e => ({ ...e, $published: new Date(e.published) }))
    .sort((a, b) => (b.$published - a.$published))
    .map(({ $published, ...e }) => e)
}

export default async function () {
  const srcRoot = join(
    this.options.srcDir,
    this.$press.blog.dir
  )

  const sources = {}
  const archive = {}

  const jobs = await walk.call(this, srcRoot, (path) => {
    if (path.startsWith('pages')) {
      return false
    }
    return /\.md$/.test(path)
  })

  const mdProcessor = await this.$press.blog.source.processor()

  const handler = async (path) => {
    const entry = await parseEntry.call(this, path, mdProcessor)
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

  if (typeof this.$press.blog.feed.path === 'function') {
    this.$press.blog.feed.path = this.$press.blog.feed.path(this.$press.blog)
  }

  return {
    static: {
      [this.$press.blog.feed.path]: (
        await generateFeed.call(this, this.$press.blog, index)
      )
    },
    topLevel: {
      index,
      archive
    },
    sources
  }
}
