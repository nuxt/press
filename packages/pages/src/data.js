import path from 'path'
import { exists, walk } from '@nuxt/blueprints'
import {
  stripParagraph,
  filePathToWebpath,
  readTextFile,
  PromisePool
} from '@nuxt-press/utils'

// SLIDES MODE
// Markdown files are loaded from the slides/ directory.
// Configurable via press.slides.dir

export async function _parsePage ({ root, path: sourcePath }, mdProcessor) {
  const raw = await readTextFile(root, sourcePath)

  const { meta, content } = await this.config.source.metadata(raw)

  // Use meta.title if given, otherwise use first H1 from body
  let title = meta.title
  if (!title) {
    [, title] = raw.match(/^#\s+(.*)/) || []
  }

  if (title) {
    // TODO: why calling markdown on title?
    title = await this.config.source.markdown(title, mdProcessor)
    title = stripParagraph(title)
  }

  // Use metadata.body if given
  const body = await this.config.source.markdown(content || raw, mdProcessor)

  // Create the proper source path
  const webpath = filePathToWebpath(sourcePath)

  let src
  if (this.nuxt.options.dev) {
    src = path.join(root, sourcePath)
  }

  return {
    ...meta,
    title,
    body,
    src,
    path: webpath
  }
}

export default async function pagesData () {
  const pagesRoot = path.join(
    this.options.srcDir,
    this.options.dir.pages
  )

  if (!await exists(pagesRoot)) {
    return {}
  }

  const sources = {}

  const parsePage = _parsePage.bind(this)
  const mdProcessor = await this.config.source.processor()
  const validate = filePath => filePath.endsWith('.md')
  const jobs = await walk(pagesRoot, { validate })

  const handler = async (filePath) => {
    const page = await parsePage({ root: pagesRoot, path: filePath }, mdProcessor)
    sources[page.path] = page
  }

  const pool = new PromisePool(jobs, handler)
  await pool.done()

  return {
    sources
  }
}
