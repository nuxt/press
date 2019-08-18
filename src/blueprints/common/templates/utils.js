export function normalizedPath (path = '', prefix, locale) {
  if (prefix) {
    path = path.substr(prefix.length)
  }

  if ((!path || path === '/') && locale) {
    return `/${locale}/`
  }

  if (!path.endsWith('/')) {
    path = `${path}/`
  }
  return path
}

export function getRouteMeta (route) {
  const { meta = {} } = route.matched.find(r => r.name.startsWith('source-')) || {}
  return meta
}
