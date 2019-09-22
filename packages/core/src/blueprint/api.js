import path from 'path'
import { existsSync, readJsonSync } from 'fs-extra'
import { trimSlashEnd } from '@nuxt-press/utils'

const sourceCache = {}

const suffixes = ['/index.json', '.json', '']

export default function coreApi ({ rootDir, dev }) {
  return {
    source (req, res, next) {
      const source = trimSlashEnd(req.url).toLowerCase()
      const cacheKey = `${rootDir}/${source}`

      if (dev || !sourceCache[cacheKey]) {
        for (const suffix of suffixes) {
          const sourceFile = path.join(rootDir, 'sources', `${source}${suffix}`)

          if (existsSync(sourceFile)) {
            sourceCache[cacheKey] = readJsonSync(sourceFile)
            break
          }
        }

        if (!sourceCache[cacheKey]) {
          const err = new Error('NuxtPress: source not found')
          err.statusCode = 404
          next(err)
          return
        }
      }

      res.json(sourceCache[cacheKey])
    }
  }
}
