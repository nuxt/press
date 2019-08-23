export function routePath (routePath, prefix) {
  if (prefix && routePath.startsWith(prefix)) {
    routePath = routePath.substr(prefix.length)
  }

  if (routePath.endsWith('/index')) {
    return routePath.slice(0, routePath.indexOf('/index'))
  }

  if (routePath === 'index') {
    return ''
  }

  return routePath
}

export const normalizePath = (str, startsToo, endsToo = true, notIfEmpty) => {
  if (notIfEmpty && !str) {
    return ''
  }

  if (endsToo && (!(str.endsWith('/') || str.includes('/#')))) {
    str = `${str}/`
  }

  if (startsToo && !str.startsWith('/')) {
    str = `/${str}`
  }

  return str
}

export function normalizePaths (paths, startsToo) {
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
      const normalizedKey = normalizePath(key, startsToo)
      paths[normalizedKey] = normalizePaths(paths[key])

      if (key !== normalizedKey) {
        delete paths[key]
      }
    }

    return paths
  }

  return normalizePath(paths, startsToo)
}
