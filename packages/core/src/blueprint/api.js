import path from 'path'
import { existsSync, readJsonSync } from 'fs-extra'

const sourceCache = {}

export default function api ({ rootDir, dev }) {
  return {
    source (req, res, next, source) {
      const cacheKey = `${rootDir}/${source}`
console.log(cacheKey)
      if (dev || !sourceCache[cacheKey]) {
        let sourceFile = path.join(rootDir, 'sources', `${source}/index.json`)
console.log('sourceFile 1', sourceFile)
        if (!existsSync(sourceFile)) {
          sourceFile = path.join(rootDir, 'sources', `${source}.json`)
console.log('sourceFile 2', sourceFile)

          if (!existsSync(sourceFile)) {
            const err = new Error('NuxtPress: source not found')
            err.statusCode = 404
            next(err)
            return
          }
        }

        sourceCache[cacheKey] = readJsonSync(sourceFile)
      }

      res.json(sourceCache[cacheKey])
    }
  }
}
