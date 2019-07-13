export function interopDefault (m) {
  return m.default || m
}

// export async function _import(modulePath) {
//   const sliceAt = resolve(this.options.rootDir).length
//   return interopDefault(await import(`.${modulePath.slice(sliceAt)}`))
// }

export async function importModule (modulePath) {
  return interopDefault(await import(modulePath))
}
