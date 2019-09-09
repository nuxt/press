import { normalizeURL, normalizePath } from '@nuxt-press/utils'

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

export function createSidebarFromToc (path, page, title, startDepth = 0) {
  const sidebar = []

  if (!page) {
    return sidebar
  }

  // eslint-disable-next-line prefer-const
  let { meta, toc = [] } = page

  if (meta.title) {
    title = meta.title
  } else if (!title && meta.home) {
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

  sidebar.push(...toc.map(([level, name, url]) => [level + startDepth, name, normalizeURL(url)]))

  return tocToTree(sidebar)
}

export function createSidebarFromRegex (pathOrRegex, routePrefix, pagePaths, pages, title, startDepth = 0) {
  const isRegex = /[.*?()^$]/.test(pathOrRegex)
  let re
  if (isRegex) {
    const isGlob = !/[.?()^$]/.test(pathOrRegex)
    if (isGlob) {
      pathOrRegex = pathOrRegex.replace(new RegExp('[*]+', 'g'), '(.*)')
    }
    re = new RegExp(pathOrRegex, 'i')
  }

  const sidebarItems = []
  for (const pagePath of pagePaths) {
    let normalizedPagePath = pagePath
    if (routePrefix && pagePath.startsWith(routePrefix)) {
      normalizedPagePath = pagePath.substr(routePrefix.length)
    }

    const isMatch = normalizedPagePath === pathOrRegex || (re && re.test(normalizedPagePath))

    // console.log(routePrefix, pathOrRegex, normalizedPagePath, isMatch ? true : false, pagePath)

    if (isMatch) {
      let sourcePath = normalizePath(pagePath.replace(/.md$/i, ''))

      sourcePath = `${routePrefix}${sourcePath}`
      sidebarItems.push(...createSidebarFromToc(sourcePath, pages[pagePath], title, startDepth))
    }
  }

  return sidebarItems
}

export function createSidebar (sidebarConfig, pages, routePrefix) {
  const pagePaths = extractPagePaths(pages, routePrefix)

  const sidebar = []
  for (let sourcePath of sidebarConfig) {
    let title
    if (Array.isArray(sourcePath)) {
      [sourcePath, title] = sourcePath
    }

    if (typeof sourcePath === 'object') {
      const title = sourcePath.title

      const sidebarChildren = []
      if (sourcePath.children) {
        for (sourcePath of sourcePath.children) {
          let sourceTitle
          if (Array.isArray(sourcePath)) {
            [sourcePath, sourceTitle] = sourcePath
          }

          if (!pages[sourcePath] && sourceTitle) {
            sidebarChildren.push([2, sourceTitle, sourcePath])
          } else {
            sidebarChildren.push(...createSidebarFromRegex(sourcePath, routePrefix, pagePaths, pages, sourceTitle, 1))
          }
        }
      }

      sidebar.push([1, title, '', sidebarChildren])
      continue
    }

    if (!pages[sourcePath] && title) {
      sidebar.push([1, title, sourcePath])
    } else {
      sidebar.push(...createSidebarFromRegex(sourcePath, routePrefix, pagePaths, pages, title))
    }
  }

  return sidebar
}

export function extractPagePaths (pages, routePrefix = '') {
  // sort page paths for current routePrefix alphabetically
  return Object.keys(pages)
    .filter(path => path.startsWith(`${routePrefix}/`))
    // remove trailing slash (page paths always have a trailing slash)
    // this is needed because normally a / sort higher than [a-z-]
    // and we dont want that
    //
    // Correct order:
    // - /path/
    // - /path-long/
    .map(path => path.substr(0, path.length - 1))
    .sort((a, b) => {
      if (a === b) { return 0 }
      return a < b ? -1 : 1
    })
    // append slash again
    .map(path => `${path}/`)
}
