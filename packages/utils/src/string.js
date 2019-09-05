import slug from 'slug'

export function stripParagraph (str) {
  str = str.replace(/^<p>/, '')
  return str.replace(/<\/p>$/, '')
}

export function trimStart (str, chr = '') {
  if (!chr) {
    return str.trimStart()
  }

  return str.replace(new RegExp(`^(${chr})+`, 'i'), '')
}

export function trimEnd (str, chr = '') {
  if (!chr) {
    return str.trimEnd()
  }

  return str.replace(new RegExp(`(${chr})+$`, 'i'), '')
}

export const trimSlashStart = str => str.replace(new RegExp(`^/+`), '')
export const trimSlashEnd = str => str.replace(new RegExp(`/+$`), '')

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
