export function routePath(routePath) {
  if (routePath.endsWith('/index')) {
    return routePath.slice(0, routePath.indexOf('/index'))
  }
  if (routePath === 'index') {
    return ''
  }
  return routePath
}
