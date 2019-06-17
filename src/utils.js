
import {
  lstatSync,
  existsSync,
  stat as _statAsync,
  readFileSync as _readFileSync,
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
export const readFileSync = _readFileSync

export function resolve(...paths) {
  return _resolve(__dirname, join(...paths))
}

export function join(...paths) {
  return _join(...paths.map(p => p.replace(/\//g, sep)))
}

export function readFile(...paths) {
  return _readFile(join(...paths), 'utf-8')
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

// This function has had so many edits
// by now it's become officially a hack
export function slugify(text) {
  const a = 'ãàáäâèéëêìíïîõòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;~'
  const b = 'aaaaaeeeeiiiiooooouuuuncsyoarsnpwgnmuxzh-------'
  const p = new RegExp(a.split('').join('|'), 'g')
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(p, c => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-e-')
    .replace(/[.'"]/g, '')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-{2,}/g, '-')
}
