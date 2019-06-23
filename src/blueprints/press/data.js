import { parse } from 'path'
import { walk, exists, join, readFile } from '../../utils'
import PromisePool from '../../pool'

// PAGES
// Markdown files under pages/ are treated as individual
// Nuxt routes using the ejectable page template

// Custom pages can be added by ensuring there's
// a .vue file matching the .md file. The processed
// contents of the .md file become available as $page
// in the custom Vue component for the page

async function loadPage(pagePath) {
  const sliceAt = join(this.options.srcDir, this.options.dir.pages).length
  let body = await readFile(this.options.srcDir, pagePath)
  const titleMatch = body.match(/^#\s+(.*)/)
  const title = titleMatch ? titleMatch[1] : ''
  body = await markdown.call(this, body, true)
  const parsed = parse(pagePath)
  const path = `${parsed.dir.slice(sliceAt)}/${parsed.name}`
  return { body, title, path }
}

export default async function() {
  const pagesRoot = join(
    this.options.srcDir,
    this.options.dir.pages
  )
  if (!exists(pagesRoot)) {
    return {}
  }
  const pages = {}
  const queue = new PromisePool(
    await walk.call(this, pagesRoot, /\.md$/),
    async (path) => {
      // Somehow eslint doesn't detect func.call(), so:
      // eslint-disable-next-line no-use-before-define
      const page = await loadPage.call(this, path)
      pages[page.path] = page
    }
  )
  await queue.done()
  return pages
}
