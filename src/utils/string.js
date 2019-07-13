import slug from 'slug'

export function trimEnd (str, chr = '') {
  if (!chr) {
    return str.trimEnd()
  }

  return str.replace(new RegExp(`${chr}+$`), '')
}

const escapeREs = {}
export function escapeChars (str, chars = '"') {
  if (Array.isArray(chars)) {
    chars = chars.join()
  }

  if (!escapeREs[chars]) {
    escapeREs[chars] = new RegExp(`([${chars}])`, 'g')
  }

  const escapeRE = escapeREs[chars]

  return str.replace(escapeRE, '\\$1')
}

export function slugify (str) {
  return slug(str, { lower: true })
}
