
import { walk, join, readFile } from '../../utils'
import PromisePool from '../../pool'

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

async function parseEntry(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath)
  const { published, summary } = this
    .$press.blog.source.head.call(this, raw)
  const title = this.$press.blog.source.title.call(this, raw)
  const body = await this.$press.blog.source.markdown
    .call(this, raw.substr(raw.indexOf('#')))
  const source = { body, title, published, summary }
  source.path = `${
    this.$press.blog.prefix
  }${
    this.$press.blog.source.path.call(this, source)
  }`
  source.type = 'entry'
  source.id = this.$press.blog.source.id.call(this, source)
  return source
}

function addArchiveEntry(archive, entry) {
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

export default async function () {
  const srcRoot = join(
    this.options.srcDir,
    this.$press.blog.dir
  )

  const sources = {}
  const archive = {}

  const queue = new PromisePool(
    await walk.call(this, srcRoot, (path) => {
      if (path.startsWith('pages')) {
        return false
      }
      return /\.md$/.test(path)
    }),
    async (path) => {
      const entry = await parseEntry.call(this, path)
      addArchiveEntry(archive, entry)
      sources[entry.path] = entry
    }
  )
  await queue.done()

  const index = Object.values(sources)
    .sort((a, b) => b.published - a.published)
    .slice(0, 10)

  return { topLevel: { index, archive }, sources }
}
