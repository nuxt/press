import { readFileSync } from 'fs'
import consola from 'consola'
import { join } from './utils'

function readStaticJson(rootDir, ...file) {
  const path = join(rootDir, 'press', 'static', ...file)
  return JSON.parse(readFileSync(path).toString())
}

export function base(_, res, next) {
  res.json = (data) => {
    res.type = 'application/json'
    res.write(JSON.stringify(data))
    res.end()
  }
  next()
}

export const docs = (rootDir) => {
  const cache = {}
  return {
    index(req, res, next) {
      if (!cache.index) {
        cache.index = readStaticJson(rootDir, 'docs', 'index.json')
      }
      res.json(cache.index)
    }
  }
}

export const blog = (rootDir) => {
  const cache = {}
  return {
    index(req, res, next) {
      if (!cache.index) {
        cache.index = readStaticJson(rootDir, 'blog', 'index.json')
      }
      res.json(cache.index)
    },
    archive(req, res, next) {
      if (!cache.archive) {
        cache.archive = readStaticJson(rootDir, 'blog', 'archive.json')
      }
      res.json(cache.archive)
    }
  }
}

export const slides = (rootDir) => {
  const cache = {}
  return {
    index(req, res, next) {
      if (!cache.index) {
        cache.index = readStaticJson(rootDir, 'slides', 'index.json')
      }
      res.json(cache.index)
    }
  }
}

const sourceCache = {}

export const source = rootDir => function source(req, res, next) {
  try {
    const source = req.url.slice(12)
    if (!sourceCache[source]) {
      sourceCache[source] = readStaticJson(rootDir, 'sources', `${source}.json`)
    }
    res.json(sourceCache[source])
  } catch (err) {
    consola.warn(err)
  }
}
