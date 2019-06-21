import consola from 'consola'
import { join, readFileSync } from './utils'

const dev = process.env.NODE_ENV !== 'production'

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
