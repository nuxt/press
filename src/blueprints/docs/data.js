
import { parse } from 'path'
import { walk, join, exists, readFile } from '../../utils'
import PromisePool from '../../pool'

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

async function parseDoc(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath)
  const fileName = parse(sourcePath).name
  const markdownResult = await this
    .$press.docs.source.markdown.call(this, raw)
  let { toc } = markdownResult
  const { html: body } = markdownResult
  const title = this.$press.docs.source.title
    .call(this, fileName, raw)
  if (toc[0]) {
    toc[0][1] = title
  } else if (['index', 'readme'].includes(fileName)) {
    // Force intro toc item if not present
    toc = [[1, 'Intro', '#intro']]
  }
  const source = { body, title, type: 'topic' }
  source.path = `${
    this.$press.docs.prefix
  }${
    this.$press.docs.source.path.call(this, fileName, source)
  }`
  return { toc, source }
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
  const queue = new PromisePool(
    await walk.call(this, srcRoot, (path) => {
      if (path.startsWith('pages')) {
        return false
      }
      return /\.md$/.test(path)
    }),
    async (path) => {
      const { toc, source } = await parseDoc.call(this, path)
      for (const tocItem of toc) {
        tocItem[2] = `${source.path}${tocItem[2]}`
        index[tocItem[2]] = tocItem
      }
      sources[source.path] = source
    }
  )
  await queue.done()

  return { topLevel: { index }, sources }
}
