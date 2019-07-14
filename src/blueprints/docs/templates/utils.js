export const externalRE = /^(https?:|mailto:|tel:|[a-z]{3,}:)/i

export function trimEnd (str, chr = '') {
  if (!chr) {
    return str.trimEnd()
  }

  return str.replace(new RegExp(`${chr}+$`), '')
}

export const trimSlash = str => trimEnd(str, '/')

export function isExternal (url) {
  return externalRE.test(url) || url.startsWith('//')
}

export function isMailto (url) {
  return url.startsWith('mailto:')
}

export function isTel (url) {
  return url.startsWith('tel:')
}

export function tocToTree (toc) {
  const sections = [undefined, [], [], [], [], [], []]
  let prevLevel = 0

  for (const [level, name, url] of toc) {
    if (level < prevLevel) {
      const lastIndex = sections[level].length - 1

      if (lastIndex > -1) {
        sections[level][lastIndex][3] = sections[prevLevel].slice()
        sections[prevLevel] = []
      }
    }

    sections[level].push([level, name, url])
    prevLevel = level
  }

  for (let level = sections.length - 1; level > 1; level--) {
    if (!sections[level].length) {
      continue
    }

    const lowerLevel = level - 1
    const lastIndex = sections[lowerLevel].length - 1
    if (lastIndex < 0) {
      return sections[level]
    }

    sections[lowerLevel][lastIndex][3] = sections[level]
    sections[level] = []
  }

  return sections[1]
}

export function createSidebarFromToc (path, title, page, startDepth = 0) {
  const sidebar = []

  if (!page) {
    return sidebar
  }

  const { meta, toc: [first, ...toc] } = page

  if (meta.home) {
    title = 'Home'
  }

  if (first || !toc.length) {
    sidebar.push([1 + startDepth, meta.title || title || first[1], path])
  }

  sidebar.push(...toc.map(([level, name, url]) => [level + startDepth, name, url]))

  return tocToTree(sidebar)
}

export function createSidebar ({ prefix }, sidebarConfig, pages) {
  const docPrefix = trimSlash(prefix)

  const sidebar = []
  for (let sourcePath of sidebarConfig) {
    let title
    if (Array.isArray(sourcePath)) {
      [sourcePath, title] = sourcePath
    }

    if (typeof sourcePath === 'object') {
      const title = sourcePath.title
      const children = []

      if (sourcePath.children) {
        for (sourcePath of sourcePath.children) {
          sourcePath = sourcePath.replace(/.md$/i, '')
          sourcePath = trimSlash(`${docPrefix}${sourcePath}`)

          children.push(...createSidebarFromToc(sourcePath, undefined, pages[sourcePath], 1))
        }
      }

      sidebar.push([1, title, '', children])
      continue
    }

    if (sourcePath !== '/') {
      sourcePath = trimSlash(`${docPrefix}${sourcePath}`)
    }

    sidebar.push(...createSidebarFromToc(sourcePath, title, pages[sourcePath]))
  }

  return sidebar
}
