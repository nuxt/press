import path from 'path'
import { readJsonSync } from 'fs-extra'

const cache = {}

export default function blogApi ({ rootDir, id, prefix, dev }) {
  return {
    index: (req, res, next) => {
      if (dev || !cache.index) {
        cache.index = readJsonSync(path.join(rootDir, id, prefix, 'index.json'))
      }

      res.json(cache.index)
    },
    archive: (req, res, next) => {
      if (dev || !cache.archive) {
        cache.archive = readJsonSync(path.join(rootDir, id, prefix, 'archive.json'))
      }

      res.json(cache.archive)
    }
  }
}
