export function ucfirst(str) {
  str = str || ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
