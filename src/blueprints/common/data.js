import path from 'path'
import { exists, walk, join, readFile, stripParagraph } from '../../utils'
import PromisePool from '../../pool'

// PAGES
// Markdown files under pages/ are treated as individual
// Nuxt routes using the ejectable page template

// Custom pages can be added by ensuring there's
// a .vue file matching the .md file. The processed
// contents of the .md file become available as $page
// in the custom Vue component for the page

const indexKeys = ['index', 'readme']
const isIndexRE = new RegExp(`(${indexKeys.join('|')})/$`, 'i')

export async function parsePage ({ options }, sourcePath, mdProcessor) {
  const src = sourcePath.slice(this.options.srcDir.length + 1)

  let body = await readFile(this.options.srcDir, sourcePath)
  const { name: fileName, dir } = path.parse(sourcePath)

  let [, title] = body.match(/^#\s+(.*)/) || []
  const sliceAt = this.options.dir.pages.length
  let filePath = `${dir.slice(sliceAt)}/${fileName}/`
  const metadata = await options.source.metadata.call(this, body)

  // Overwrite title if given as metadata
  title = metadata.title || title
  if (title) {
    title = await options.source.markdown.call(this, title, mdProcessor)
    title = stripParagraph(title)
  }

  // Overwrite body if given as metadata
  body = metadata.body || body
  body = await options.source.markdown.call(this, body, mdProcessor)

  filePath = filePath.replace(isIndexRE, '') || 'index'
  const urlPath = filePath === 'index' ? '/' : filePath.replace(/\/index$/, '')

  return {
    ...metadata,
    title,
    body,
    path: urlPath,
    ...this.options.dev && { src }
  }
}

export default async function (context) {
  const pagesRoot = join(
    this.options.srcDir,
    this.options.dir.pages
  )

  if (!exists(pagesRoot)) {
    return {}
  }

  const { options } = context

  const pages = {}
  const mdProcessor = await options.source.processor()

  const queue = new PromisePool(
    await walk.call(this, pagesRoot, /\.md$/),
    async (path) => {
      // Somehow eslint doesn't detect func.call(), so:
      // eslint-disable-next-line no-use-before-define
      const page = await parsePage.call(this, context, path, mdProcessor)
      pages[page.path] = page
    }
  )

  await queue.done()

  return {
    sources: pages
  }
}
