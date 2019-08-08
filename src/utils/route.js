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
