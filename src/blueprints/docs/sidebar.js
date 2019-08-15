export const normalizePath = str => str.endsWith('/') || str.includes('/#') ? str : `${str}/`

export function normalizePaths (paths) {
  if (Array.isArray(paths)) {
    for (const key in paths) {
      paths[key] = normalizePaths(paths[key])
    }
    return paths
  }

  if (typeof paths === 'object') {
    if (paths.children) {
      paths.children = normalizePaths(paths.children)
      return paths
    }

    for (const key in paths) {
      const normalizedKey = normalizePath(key)
      paths[normalizedKey] = normalizePaths(paths[key])

      if (key !== normalizedKey) {
        delete paths[key]
      }
    }

    return paths
  }

  return normalizePath(paths)
}

export function tocToTree (toc) {
  const sections = [undefined, [], [], [], [], [], []]
  let prevLevel = 0

  for (const [level, name, url] of toc) {
    if (level < prevLevel) {
      for (;prevLevel > level; prevLevel--) {
        const currentLevel = prevLevel - 1
        const lastIndex = sections[currentLevel].length - 1

        if (lastIndex > -1) {
          sections[currentLevel][lastIndex][3] = sections[prevLevel]
        } else {
          sections[currentLevel] = sections[prevLevel]
        }
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

    let lowerLevel = level
    let lastIndex = -1
    while (lastIndex < 0 && lowerLevel > 1) {
      lowerLevel = lowerLevel - 1

      if (sections[lowerLevel]) {
        lastIndex = sections[lowerLevel].length - 1
      }
    }

    if (lastIndex > -1) {
      sections[lowerLevel][lastIndex][3] = sections[level]
    } else {
      sections[lowerLevel] = sections[level]
    }
    sections[level] = []
  }

  return sections[1]
}

export function createSidebarFromToc (path, title, page, startDepth = 0) {
  const sidebar = []

  if (!page) {
    return sidebar
  }

  // eslint-disable-next-line prefer-const
  let { meta, toc = [] } = page

  if (meta.title) {
    title = meta.title
  } else if (meta.home) {
    title = 'Home'
  }

  // If the page has no toc, add an item
  let sidebarAddPage = !toc.length
  if (!sidebarAddPage && title) {
    const firstToc = toc[0]

    // if the first item in the toc is not a level 1
    // and a title has been set, add an item for the page
    if (firstToc[0] !== 1) {
      sidebarAddPage = true
    }

    // always (re-)set the title, this is so meta.title
    // can overwrite the page title in the sidebar
    if (firstToc[0] === 1) {
      toc[0][1] = title
    }
  }

  if (sidebarAddPage) {
    sidebar.push([1, title || path, normalizePath(path)])
  }

  // normalize skip levels to array
  let sidebarSkipLevels = meta.sidebarSkipLevels
  if (!sidebarSkipLevels && meta.sidebarSkipLevel) {
    sidebarSkipLevels = [meta.sidebarSkipLevel]
  }

  if (sidebarSkipLevels) {
    const skipCount = meta.sidebarSkipCount || Infinity
    let skipCounter = 0
    toc = toc.filter(([level]) => {
      if (!sidebarSkipLevels.includes(level)) {
        return true
      }

      if (skipCounter < skipCount) {
        skipCounter++
        return false
      }

      return true
    })
  }

  sidebar.push(...toc.map(([level, name, url]) => [level + startDepth, name, normalizePath(url)]))

  return tocToTree(sidebar)
}

export function createSidebar (sidebarConfig, pages, routePrefix) {
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
          sourcePath = normalizePath(sourcePath.replace(/.md$/i, ''))

          const pagePath = `${routePrefix}${sourcePath}`
          children.push(...createSidebarFromToc(sourcePath, undefined, pages[pagePath], 1))
        }
      }

      sidebar.push([1, title, '', children])
      continue
    }

    const pagePath = `${routePrefix}${sourcePath}`

    sidebar.push(...createSidebarFromToc(sourcePath, title, pages[pagePath]))
  }

  return sidebar
}
