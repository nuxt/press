
import {
  lstatSync,
  existsSync,
  readFileSync,
  stat as _statAsync,
  readFile as _readFileAsync,
  writeFile as _writeFileAsync,
  appendFile as _appendFileAsync,
  readdirSync
} from 'fs'

import {
  dirname,
  join as _join,
  sep
} from 'path'

import { promisify } from 'util'
import { writeJson, ensureDir as _ensureDir, remove, move } from 'fs-extra'
import klaw from 'klaw'

const _stat = promisify(_statAsync)
const _readFile = promisify(_readFileAsync)
const _writeFile = promisify(_writeFileAsync)
const _appendFile = promisify(_appendFileAsync)

export {
  dirname,
  writeJson,
  remove,
  move,
  readdirSync,
  readFileSync
}

export function exists(...paths) {
  return existsSync(join(...paths))
}

export const stat = _stat

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

export function appendFile(path, contents) {
  return _appendFile(path, contents, 'utf-8')
}

export function isDir(path) {
  return lstatSync(path).isDirectory()
}

export function ensureDir(...paths) {
  return _ensureDir(join(...paths))
}

export function routePath(routePath) {
  if (routePath.endsWith('/index')) {
    return routePath.slice(0, routePath.indexOf('/index'))
  }
  if (routePath === 'index') {
    return ''
  }
  return routePath
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
