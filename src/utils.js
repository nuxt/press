
import defu from 'defu'

import {
  lstatSync,
  existsSync,
  readFileSync,
  readdirSync,
  stat as _statAsync,
  readFile as _readFileAsync,
  writeFile as _writeFileAsync
} from 'fs'

import {
  dirname,
  resolve as _resolve,
  join as _join,
  sep
} from 'path'

import { promisify } from 'util'
import { writeJson, ensureDir as _ensureDir, remove, move } from 'fs-extra'
import klaw from 'klaw'
import slug from 'slug'

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

export function ensureDir(...paths) {
  return _ensureDir(join(...paths))
}

export async function updateJson(path, obj) {
  if (!exists(path)) {
    await writeJson(path, obj, { spaces: 2 })
    return
  }
  const jsonFile = await readFile(path)
  let json = {}
  try {
    json = JSON.parse(jsonFile)
  } catch(_) {}
  await writeFile(path, JSON.stringify(defu(json, obj), null, 2))
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

export function isSingleMode(otherModes) {
  if (otherModes.every(m => !exists(join(this.options.srcDir, m)))) {
    const pagesDir = join(this.options.srcDir, this.options.dir.pages)
    if (!exists(pagesDir)) {
      return true
    } else if (!readdirSync(pagesDir).length) {
      return true
    }
  }
}

export function slugify(str) {
  return slug(str, { lower: true })
}

export function interopDefault(m) {
  return m.default || m
}

export async function _import(modulePath) {
  return interopDefault(await import(modulePath))
}

export { readdirSync, readFileSync } from 'fs'
export {
  dirname,
  writeJson,
  remove,
  move
}
