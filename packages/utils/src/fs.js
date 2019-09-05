import path from 'path'
import util from 'util'
import fs from 'fs-extra'
import klaw from 'klaw'
import PromisePool from './pool'

export {
  readFile,
  writeFile,
  readJson,
  writeJson,
  ensureDir
} from 'fs-extra'

export const readTextFile = (...paths) => fs.readFile(path.join(...paths), { encoding: 'utf8' })
export const copyFile = util.promisify(fs.copyFile)

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

export function resolve (...paths) {
  return path.resolve(__dirname, '..', path.join(...paths))
}

export function getDirsAsArray (dirs) {
  if (Array.isArray(dirs)) {
    return dirs
  }

  if (typeof dirs === 'object') {
    return Object.keys(dirs)
  }

  return [dirs]
}

export async function saveFiles (files, rootDir, prepareFilepath, isJson) {
  const pool = new PromisePool(Object.keys(files), async (fileName) => {
    let filePath = path.join(rootDir, fileName)
    if (typeof prepareFilepath === 'function') {
      filePath = prepareFilepath(filePath, files[fileName])
    }

    const fileDir = path.dirname(filePath)

    await fs.ensureDir(fileDir)
    const content = await files[fileName]

    if (isJson) {
      await fs.writeJson(filePath, content)
    } else {
      await fs.writeFile(filePath, content)
    }
  })

  await pool.done()
}

export function saveJsonFiles (files, rootDir, prepareFilepath) {
  return saveFiles(files, rootDir, prepareFilepath, true)
}
