import path from 'path'
import {
  indexKeysRE,
  stripParagraph,
  normalizePath,
  walk,
  existsAsync,
  readFileAsync,
  PromisePool
} from '@nuxtpress/utils'

// SLIDES MODE
// Markdown files are loaded from the slides/ directory.
// Configurable via press.slides.dir

export async function _parsePage ({ root, path: sourcePath }, mdProcessor) {
  const raw = await readFileAsync(path.join(root, sourcePath), { encoding: 'utf8' })

  const metadata = await this.config.source.metadata(raw)

  // Use metadata.title if given, otherwise use first H1 from body
  let title = metadata.title
  if (!title) {
    [, title] = raw.match(/^#\s+(.*)/) || []
  }

  if (title) {
    title = await this.config.source.markdown(title, mdProcessor)
    title = stripParagraph(title)
  }

  // Use metadata.body if given
  const body = await this.config.source.markdown(metadata.body || raw, mdProcessor)

  // Create the proper source path
  const urlPath = normalizePath(sourcePath.slice(0, -3).replace(indexKeysRE, '') || '/', true)

  let src
  if (this.nuxt.options.dev) {
    src = sourcePath.slice(this.nuxt.options.srcDir.length + 1)
  }

  return {
    ...metadata,
    title,
    body,
    src,
    path: urlPath
  }
}

export default async function pagesData () {
  const pagesRoot = path.join(
    this.options.srcDir,
    this.options.dir.pages
  )

  if (!await existsAsync(pagesRoot)) {
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
