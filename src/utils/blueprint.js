import { exists } from './fs'
import { normalizePaths } from './route'
import { trimSlash } from './string'

export function getDirsAsArray (dirs) {
  if (Array.isArray(dirs)) {
    return dirs
  }

  if (typeof dirs === 'object') {
    return Object.keys(dirs)
  }

  return [dirs]
}

export function isBlueprintEnabled ({ rootOptions, options }, { id, defaultPrefix, defaultDir }) {
  if (rootOptions.$standalone === id) {
    options.dir = options.dir || ''
    options.prefix = normalizePaths(options.prefix, true) || '/'
    options.$normalizedPrefix = trimSlash(options.prefix || '')
    return true
  }

  if (!options.prefix) {
    options.prefix = defaultPrefix
  } else {
    options.prefix = normalizePaths(options.prefix, true)
  }

  if (options.dir === undefined) {
    options.dir = defaultDir
  }

  options.$normalizedPrefix = trimSlash(options.prefix || '')

  const dirs = getDirsAsArray(options.dir)
  for (const dir of dirs) {
    if (exists(this.options.srcDir, dir)) {
      return true
    }
  }

  return false
}
