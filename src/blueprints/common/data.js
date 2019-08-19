import { exists, walk, join, readFile, stripP } from '../../utils'
import PromisePool from '../../pool'

// PAGES
// Markdown files under pages/ are treated as individual
// Nuxt routes using the ejectable page template

// Custom pages can be added by ensuring there's
// a .vue file matching the .md file. The processed
// contents of the .md file become available as $page
// in the custom Vue component for the page

const isIndexRE = new RegExp(`(^|/)index$`, 'i')

export async function loadPage (pagePath, mdProcessor) {
  let body = await readFile(this.options.srcDir, pagePath)
  const src = pagePath.slice(this.options.srcDir.length + 1)

  let path = src.substr(0, src.lastIndexOf('.')).replace(isIndexRE, '') || 'index'
  path = path === 'index' ? '/' : `/${path.replace(/\/index$/, '')}/`

  const metadata = await this.$press.common.source.metadata.call(this, body)
  const titleMatch = body.match(/^#\s+(.*)/)
  let title = titleMatch ? titleMatch[1] : ''

  // Overwrite body if given as metadata
  if (metadata.body) {
    body = metadata.body
  }
  // Overwrite title if given as metadata
  if (metadata.title) {
    title = metadata.title
  }
  body = await this.$press.common.source.markdown.call(this, body, mdProcessor)
  title = stripP(await this.$press.common.source.markdown.call(this, title, mdProcessor))

  return {
    ...metadata,
    body,
    title,
    path,
    src: this.options.dev ? src : undefined
  }
}

export default async function () {
  const pagesRoot = join(
    this.options.srcDir,
    this.options.dir.pages
  )
  if (!exists(pagesRoot)) {
    return {}
  }
  const pages = {}
  const mdProcessor = await this.$press.common.source.processor()
  const queue = new PromisePool(
    await walk.call(this, pagesRoot, /\.md$/),
    async (path) => {
      // Somehow eslint doesn't detect func.call(), so:
      // eslint-disable-next-line no-use-before-define
      const page = await loadPage.call(this, path, mdProcessor)
      pages[page.path] = page
    }
  )
  await queue.done()
  return { sources: pages }
}
