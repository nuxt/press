
import {
  lstatSync,
  existsSync,
  readFileSync,
  stat as _statAsync,
  readFile as _readFileAsync,
  writeFile as _writeFileAsync
} from 'fs'

import {
  resolve as _resolve,
  join as _join,
  sep
} from 'path'

import { promisify } from 'util'
import klaw from 'klaw'

const _stat = promisify(_statAsync)
const _readFile = promisify(_readFileAsync)
const _writeFile = promisify(_writeFileAsync)

export function exists(...paths) {
  return existsSync(join(...paths))
}

export const stat = _stat

export function resolve(...paths) {
  return _resolve(__dirname, join(...paths))
}

export function join(...paths) {
  return _join(...paths.map(p => p.replace(/\//g, sep)))
}

export function readFile(...paths) {
  return _readFile(join(...paths), 'utf-8')
}

export function readJsonSync(...path) {
  return JSON.parse(readFileSync(join(...path)).toString())
}

export function writeFile(path, contents) {
  return _writeFile(path, contents, 'utf-8')
}

export function isDir(path) {
  return lstatSync(path).isDirectory()
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
        if (validate(path)) {
          matches.push(path)
        }
      })
      .on('end', () => resolve(matches))
  })
}

export { writeJson, ensureDir, remove, move } from 'fs-extra'
export { readdirSync, readFileSync } from 'fs'
export { dirname } from 'path'
export { default as slugify } from 'slug'
