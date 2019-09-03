import path from 'path'
import { existsSync, readJsonSync } from 'fs-extra'

const cache = {}

export default function blogApi ({ rootDir, id, dev }) {
  return {
    index: (req, res, next) => {
      if (dev || !cache.index) {
        cache.index = readJsonSync(path.join(rootDir, id, 'index.json'))
      }

      res.json(cache.index)
    },
    archive: (req, res, next) => {
      if (dev || !cache.archive) {
        cache.archive = readJsonSync(path.join(rootDir, id, 'archive.json'))
      }

      res.json(cache.archive)
    }
  }
}
