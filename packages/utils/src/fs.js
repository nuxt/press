import path from 'path'
import fs from 'fs-extra'
import PromisePool from './pool'

export {
  readFile,
  writeFile,
  readJson,
  writeJson,
  ensureDir
} from 'fs-extra'

export const readTextFile = (...paths) => fs.readFile(path.join(...paths), { encoding: 'utf8' })

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
