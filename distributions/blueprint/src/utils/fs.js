import fs from 'fs'
import klaw from 'klaw'
export { readFile, copyFile, ensureDir } from 'fs-extra'

export function exists (p) {
  return new Promise((resolve, reject) => {
    fs.access(p, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false)
        return
      }

      resolve(true)
    })
  })
}

export function createFileFilter (filter) {
  if (!filter) {
    return
  }

  if (filter instanceof RegExp) {
    return path => filter.test(path)
  }

  if (typeof filter === 'string') {
    return path => path.includes(filter)
  }

  return filter
}

export function walk (dir, { validate, sliceRoot = true } = {}) {
  const matches = []

  let sliceAt
  if (sliceRoot) {
    if (sliceRoot === true) {
      sliceRoot = dir
    }

    sliceAt = sliceRoot.length + (sliceRoot.endsWith('/') ? 0 : 1)
  }

  validate = createFileFilter(validate)

  return new Promise((resolve) => {
    klaw(dir)
      .on('data', (match) => {
        const path = sliceAt ? match.path.slice(sliceAt) : match.path

        if (!path.includes('node_modules') && (!validate || validate(path))) {
          matches.push(path)
        }
      })
      .on('end', () => resolve(matches))
  })
}
