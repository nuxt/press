import slug from 'slug'

export function stripP (str) {
  str = str.replace(/^<p>/, '')
  return str.replace(/<\/p>$/, '')
}

export function trimEnd (str, chr = '') {
  if (!chr) {
    return str.trimEnd()
  }

  return str.replace(new RegExp(`${chr}+$`), '')
}

export const trimSlash = str => trimEnd(str, '/')

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

export function markdownToText (markdown) {
  // fully strip code blocks
  markdown = markdown.replace(/<code[^>]*>[\s\S]*?<\/code>/gmi, '')

  // strip other html tags
  markdown = markdown.replace(/<\/?[^>]+(>|$)/g, '')

  return markdown
}
