import path from 'path'
import { normalizePathPrefix, normalizePath } from './normalize'

export const indexKeys = ['index', 'readme']

export const indexKeysRE = new RegExp(`(^|/)(${indexKeys.join('|')})/?$`, 'i')

export function filePathToWebpath (filePath, opts = {}) {
  const {
    extension = '',
    prefix,
    strip = indexKeysRE,
    sep = path.sep
  } = opts

  let webpath = filePath

  if (sep === '\\') {
    webpath = webpath.replace(/\\/g, '/')
  }

  // strip extension
  if (extension && webpath.endsWith(extension)) {
    webpath = webpath.slice(0, -1 * extension.length)
  } else {
    webpath = webpath.substr(0, webpath.lastIndexOf('.'))
  }

  if (strip) {
    webpath = webpath.replace(strip, '')
  }

  let webprefix
  if (prefix) {
    webprefix = normalizePathPrefix(prefix)
  } else {
    webprefix = ''
  }

  return `${webprefix}${normalizePath(webpath)}`
}
