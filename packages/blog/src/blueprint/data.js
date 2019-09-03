import path from 'path'
import consola from 'consola'
import lodashTemplate from 'lodash/template'
import {
  walk,
  existsAsync,
  readFileAsync,
  createJobsFromConfig,
  PromisePool
} from '@nuxtpress/utils'

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

export async function parseEntry ({ root, prefix: pagePrefix = '', path: sourcePath }, mdProcessor) {
  // TODO just completely rewrite this function, please
  const { name: fileName } = path.parse(sourcePath)

  const raw = await readFileAsync(path.join(root, sourcePath), { encoding: 'utf8' })

  const metadata = this.config.source.metadata.call(this, fileName, raw)
  if (metadata instanceof Error) {
    consola.warn(metadata.message)
    return
  }

  const title = metadata.title || this.config.source.title.call(this, raw)
  const slug = metadata.slug
  const published = metadata.published

  const body = await this.config.source.markdown.call(this, metadata.content || raw.substr(raw.indexOf('#')), mdProcessor)
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
    ...this.nuxt.options.dev && { src: sourcePath }
  }

  source.id = this.config.source.id.call(this, source)
  source.path = `${this.config.prefix}${slug || this.config.source.path.call(this, fileName, source)}`

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

async function generateFeed (entries) {
  // TODO: get 'press'/rootId from core?
  let srcPath = path.join(this.nuxt.options.srcDir, 'press', this.id, 'static', 'rss.xml')
  if (!await existsAsync(srcPath)) {
    srcPath = path.join(__dirname, 'static', 'rss.xml')
  }
  const template = lodashTemplate(await readFileAsync(srcPath))
  return template({ blog: this.config, entries })
}

function sortEntries (entries) {
  return entries
    .map(e => ({ ...e, $published: new Date(e.published) }))
    .sort((a, b) => (b.$published - a.$published))
    .map(({ $published, ...e }) => e)
}

export default async function data () {
  const sources = {}
  const archive = {}

  const jobs = await createJobsFromConfig(this.nuxt.options, this.config)

  const mdProcessor = await this.config.source.processor()

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
      index,
      archive
    },
    sources
  }
}
