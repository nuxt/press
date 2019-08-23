import path from 'path'
import { walk, join, readFile, trimSlash, normalizePaths } from '../../utils'
import PromisePool from '../../pool'

// SLIDES MODE
// Markdown files are loaded from the slides/ directory.
// Configurable via press.slides.dir

export async function parseSlides (context, sourcePath, mdProcessor) {
  const { options } = context
  const raw = await readFile(this.options.srcDir, sourcePath)
  let slides = []
  let c
  let i = 0
  let s = 0
  let escaped = false
  for (i = 0; i < raw.length; i++) {
    c = raw.charAt(i)
    if (c === '\n') {
      if (raw.charAt(i + 1) === '`' && raw.slice(i + 1, i + 4) === '```') {
        escaped = !escaped
        i = i + 3
        continue
      }
      if (escaped) {
        continue
      }
      if (raw.charAt(i + 1) === '#') {
        if (raw.slice(i + 2, i + 3) !== '#') {
          slides.push(raw.slice(s, i).trimStart())
          s = i
        }
      }
    }
  }
  slides.push(slides.length > 0
    ? raw.slice(s, i).trimStart()
    : raw
  )
  slides = await Promise.all(
    slides.filter(Boolean).map((slide) => {
      return this.$press.slides.source.markdown.call(this, slide, mdProcessor)
    })
  )

  const { name: fileName } = path.parse(sourcePath)
  const urlPath = `${trimSlash(options.prefix || '')}${normalizePaths(options.source.path.call(this, fileName), true)}`

  const source = {
    type: 'slides',
    slides,
    path: urlPath,
    ...this.options.dev && { src: sourcePath }
  }

  return source
}

export default async function (context) {
  const { options } = context

  const sources = {}

  const srcRoot = join(
    this.options.srcDir,
    this.$press.slides.dir
  )

  const jobs = await walk.call(this, srcRoot, (path) => {
    if (path.startsWith('pages')) {
      return false
    }
    return /\.md$/.test(path)
  })

  const mdProcessor = await options.source.processor()

  const handler = async (path) => {
    const slides = await parseSlides.call(this, context, path, mdProcessor)
    sources[slides.path] = slides
  }

  const pool = new PromisePool(jobs, handler)
  await pool.done()

  const index = Object.values(sources)

  return {
    topLevel: {
      index
    },
    sources
  }
}
