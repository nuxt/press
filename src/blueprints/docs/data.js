
import { parse } from 'path'
import { walk, join, exists, readFile } from '../../utils'
import PromisePool from '../../pool'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

async function parseDoc(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath)
  const { name: fileName } = parse(sourcePath)

  // eslint-disable-next-line prefer-const
  let { toc, html: body } = await this.$press.docs.source.markdown.call(this, raw)
  const title = this.$press.docs.source.title.call(this, fileName, raw)

  if (toc.length && toc[0]) {
    toc[0][1] = title
  } else if (['index', 'readme'].includes(fileName)) {
    // Force intro toc item if not present
    toc = [[1, 'Intro', '#intro']]
  }

  const source = {
    type: 'topic',
    title,
    body
  }

  const pathPrefix = this.$press.docs.prefix
  const path = this.$press.docs.source.path.call(this, fileName, source)

  return {
    toc,
    source: {
      ...source,
      path: `${pathPrefix}${path}`
    }
  }
}

export default async function (data) {
  const sources = {}

  let srcRoot = join(
    this.options.srcDir,
    this.$press.docs.dir
  )

  if (!exists(srcRoot)) {
    srcRoot = this.options.srcDir
  }

  const index = {}

  const jobs = await walk.call(this, srcRoot, (path) => {
    if (path.startsWith('pages')) {
      return false
    }
    return /\.md$/.test(path)
  })

  const handler = async (path) => {
    const { toc, source } = await parseDoc.call(this, path)

    for (const tocItem of toc) {
      tocItem[2] = `${source.path}${tocItem[2]}`
      index[tocItem[2]] = tocItem
    }
    sources[source.path] = source
  }

  const queue = new PromisePool(jobs, handler)
  await queue.done()

  return {
    topLevel: {
      index
    },
    sources
  }
}
