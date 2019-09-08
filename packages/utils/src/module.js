import path from 'path'

export function interopDefault (m) {
  return m.default || m
}

export async function importModule (modulePath, ...modulePaths) {
  if (Array.isArray(modulePaths)) {
    modulePath = path.join(modulePath, ...modulePaths)
  }

  return interopDefault(await import(modulePath))
}
