
export function getDirsAsArray (dirs) {
  if (Array.isArray(dirs)) {
    return dirs
  }

  if (typeof dirs === 'object') {
    return Object.keys(dirs)
  }

  return [dirs]
}
