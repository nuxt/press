import path from 'path'
import {
  readTextFile,
  createJobsFromConfig,
  filePathToWebpath,
  normalizePath,
  PromisePool
} from '@nuxtpress/utils'

// SLIDES MODE
// Markdown files are loaded from the slides/ directory.
// Configurable via press.slides.dir

export async function _parseSlides ({ root, prefix = '', path: sourcePath }, mdProcessor) {
  const raw = await readTextFile(root, sourcePath)

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
    slides.filter(Boolean).map(slide => this.config.source.markdown(slide, mdProcessor))
  )

  const { name: fileName } = path.parse(sourcePath)
  const webpath = `${this.config.prefix}${filePathToWebpath(sourcePath, { prefix })}`

  const source = {
    type: 'slides',
    slides,
    path: webpath,
    ...this.nuxt.options.dev && { src: path.join(root, prefix, sourcePath) }
  }

  return source
}

export default async function slidesData () {
  const sources = {}

  const parseSlides = _parseSlides.bind(this)
  const mdProcessor = await this.config.source.processor()
  const jobs = await createJobsFromConfig(this.nuxt.options, this.config)

  const handler = async (path) => {
    const slides = await parseSlides(path, mdProcessor)
    sources[slides.path] = slides
  }

  const pool = new PromisePool(jobs, handler)
  await pool.done()

  const index = Object.values(sources)

  return {
    topLevel: {
      [`${this.config.prefix}/index`]: index
    },
    sources
  }
}
