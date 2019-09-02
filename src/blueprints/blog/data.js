import path from 'path'
import consola from 'consola'
import lodashTemplate from 'lodash/template'
import { resolve, exists, walk, join, readFile } from '../../utils'
import PromisePool from '../../pool'

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

export async function parseEntry ({ options }, sourcePath, mdProcessor) {
  // TODO just completely rewrite this function, please
  const { name: fileName } = path.parse(sourcePath)
  const raw = await readFile(this.options.srcDir, sourcePath)

  const metadata = options.source.metadata.call(this, fileName, raw)
  if (metadata instanceof Error) {
    consola.warn(metadata.message)
    return
  }

  const title = metadata.title || options.source.title.call(this, raw)
  const slug = metadata.slug
  const published = metadata.published

  const body = await options.source.markdown.call(this, metadata.content || raw.substr(raw.indexOf('#')), mdProcessor)
  delete metadata.content

  const source = {
    ...metadata,
    type: 'entry',
    id: undefined,
    title,
    body,
    slug,
    path: undefined,
    published,
    ...this.options.dev && { src: sourcePath }
  }

  source.id = options.source.id.call(this, source)
  source.path = `${options.prefix}${slug || options.source.path.call(this, fileName, source)}`

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

async function generateFeed ({ blueprintId, rootId, id, options }, entries) {
  let srcPath = join(this.options.srcDir, rootId, blueprintId, 'static', 'rss.xml')
  if (!exists(srcPath)) {
    srcPath = resolve('blueprints', blueprintId, 'templates', 'static', 'rss.xml')
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

export default async function (context) {
  const { options } = context

  const srcRoot = join(this.options.srcDir, options.dir)

  const sources = {}
  const archive = {}

  const jobs = await walk.call(this, srcRoot, (path) => {
    if (path.startsWith('pages')) {
      return false
    }
    return /\.md$/.test(path)
  })

  const mdProcessor = await options.source.processor()

  const handler = async (path) => {
    const entry = await parseEntry.call(this, context, path, mdProcessor)
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

  if (typeof options.feed.path === 'function') {
    options.feed.path = options.feed.path(options)
  }

  return {
    static: {
      [options.feed.path]: (
        await generateFeed.call(this, context, index)
      )
    },
    topLevel: {
      index,
      archive
    },
    sources
  }
}
