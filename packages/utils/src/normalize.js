import { URL } from 'url'
import { trimSlashStart, trimSlashEnd, trimEnd } from './string'

/* export function normalizeSourcePath (input, prefix) {
  // just convert any falsy value to
  // string without type checking
  if (!input) {
    input = ''
  }

  if (prefix && input.startsWith(prefix)) {
    input = input.substr(prefix.length)
  }

  if (input.endsWith('/index')) {
    return input.slice(0, input.indexOf('/index'))
  }

  if (input === 'index') {
    return '/'
  }

  return input || '/'
} */

export const normalizePathPrefix = (prefix) => {
  return normalizePath(prefix, { start: true, end: false, empty: false })
}

export const normalizePathSuffix = (prefix, end = true) => {
  return normalizePath(prefix, { start: false, end, empty: false })
}

export function normalizePath (input, opts = {}) {
  const {
    start = true, // should start with slash?
    end = true, // should end with slash?
    index = undefined, // should end with 'index'
    empty = true // do something when input is empty?
  } = opts

  if (!input || (!empty && input === '/')) {
    // just convert any falsy value to
    // string without type checking
    input = ''

    if (!empty) {
      return input
    }
  }

  const endsWithSlash = input.endsWith('/')
  if (end & !endsWithSlash) {
    input = `${input}/`
  } else if (!end && endsWithSlash) {
    input = trimSlashEnd(input)
  }

  const startsWithSlash = input.startsWith('/')
  if (start && !startsWithSlash) {
    input = `/${input}`
  } else if (!start && startsWithSlash) {
    input = trimSlashStart(input)
  }

  if (index !== undefined) {
    const endsWithIndex = input.endsWith(`/index${end ? '/' : ''}`)
    if (index && !endsWithIndex) {
      input = `${input}${input === '/' || end ? '' : '/'}index${end ? '/' : ''}`
    } else if (!index && endsWithIndex) {
      input = trimEnd(input, `${end ? '' : '/'}index/?`)
    }
  }

  return input
}

// URL doesnt work properly without a base, set a random one
export function normalizeURL (uri, { base = 'http://1ff0418ec8262bb2654d4108c436015d.nl', ...opts } = {}) {
  const url = new URL(uri, base)

  url.pathname = normalizePath(url.pathname, {
    index: false,
    ...opts
  })

  return `${url.pathname}${url.search}${url.hash}`
}

export function normalizePaths (paths, opts) {
  if (Array.isArray(paths)) {
    for (const key in paths) {
      paths[key] = normalizePaths(paths[key], opts)
    }
    return paths
  }

  if (typeof paths === 'object') {
    if (paths.children) {
      paths.children = normalizePaths(paths.children)
      return paths
    }

    for (const key in paths) {
      const normalizedKey = normalizePath(key, opts)
      paths[normalizedKey] = normalizePaths(paths[key])

      if (key !== normalizedKey) {
        delete paths[key]
      }
    }

    return paths
  }

  return normalizePath(paths, opts)
}
