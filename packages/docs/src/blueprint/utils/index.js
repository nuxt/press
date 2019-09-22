export const externalRE = /^(https?:|mailto:|tel:|[a-z]{3,}:)/i

export function isExternal (url) {
  return externalRE.test(url) || url.startsWith('//')
}

export function isMailto (url) {
  return url.startsWith('mailto:')
}

export function isTel (url) {
  return url.startsWith('tel:')
}
