import fs, { readdirSync, readFileSync, writeJson, remove, move } from 'fs-extra'
import path, { dirname } from 'path'
import { promisify } from 'util'
import klaw from 'klaw'

export {
  readdirSync,
  readFileSync,
  writeJson,
  remove,
  move,
  dirname
}

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const appendFileAsync = promisify(fs.appendFile)

export const stat = promisify(fs.stat)

export function join(...paths) {
  return path.join(...paths.map(p => p.replace(/\//g, path.sep)))
}

export function exists(...paths) {
  return fs.existsSync(join(...paths))
}

export function readFile(...paths) {
  return readFileAsync(join(...paths), 'utf-8')
}

export function writeFile(path, contents) {
  return writeFileAsync(path, contents, 'utf-8')
}

export function appendFile(path, contents) {
  return appendFileAsync(path, contents, 'utf-8')
}

export function readJsonSync(...paths) {
  return JSON.parse(fs.readFileSync(join(...paths)).toString())
}

export function isDir(path) {
  return fs.lstatSync(path).isDirectory()
}

export function ensureDir(...paths) {
  return fs.ensureDir(join(...paths))
}

export function walk(root, validate, sliceAtRoot = false) {
  const matches = []
  const sliceAt = (sliceAtRoot ? root : this.options.srcDir).length + 1

  if (validate instanceof RegExp) {
    const pattern = validate
    validate = path => pattern.test(path)
  }

  return new Promise((resolve) => {
    klaw(root)
      .on('data', (match) => {
        const path = match.path.slice(sliceAt)

        if (validate(path) && !path.includes('node_modules')) {
          matches.push(path)
        }
      })
      .on('end', () => resolve(matches))
  })
}
