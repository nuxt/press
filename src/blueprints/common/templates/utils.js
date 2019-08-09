
export function trimEnd (str, chr = '') {
  if (!chr) {
    return str.trimEnd()
  }

  return str.replace(new RegExp(`${chr}+$`), '')
}

export const trimSlash = str => trimEnd(str, '/')

export const normalizePath = str => str.endsWith('/') || str.includes('/#') ? str : `${str}/`

export function normalizePaths (paths) {
  if (Array.isArray(paths)) {
    for (const key in paths) {
      paths[key] = normalizePaths(paths[key])
    }
    return paths
  }

  if (typeof paths === 'object') {
    if (paths.children) {
      paths.children = normalizePaths(paths.children)
      return paths
    }

    for (const key in paths) {
      const normalizedKey = normalizePath(key)
      paths[normalizedKey] = normalizePaths(paths[key])

      if (key !== normalizedKey) {
        delete paths[key]
      }
    }

    return paths
  }

  return normalizePath(paths)
}
