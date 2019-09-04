import path from 'path'
import { readJsonSync } from 'fs-extra'

const cache = {}

export default function slidesApi ({ rootDir, id, prefix, dev }) {
  return {
    index: (req, res, next) => {
      if (dev || !cache.index) {
        cache.index = readJsonSync(path.join(rootDir, id, prefix, 'index.json'))
      }
      res.json(cache.index)
    }
  }
}
