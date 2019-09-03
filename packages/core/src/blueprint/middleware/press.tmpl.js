import { getRouteMeta } from '../utils'

const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const maxCacheCount = 5
const sourcesCache = []

async function getSource ($press, path) {
  <%
  /* Only load sources from fs when $hasSources is set,
   * the folder doesnt exists when there arent sources
   * which results in an error.
   * Dont like to do a fs.exists cause i/o is heavy
   */
  if (options.rootOptions.$hasSources) {
  %>
  if (path.startsWith('api/source/')) {
    try {
      const source = await import(
        /* webpackInclude: /\.json$/ */
        <% if (options.dev) { %>
        /* webpackChunkName: 'source-[request]' */
        <% } %>
        /* webpackPreload: true */
        `../../static/sources/${path.substr(11)}`
      )

      return source
    } catch (err) {
      // return when the source doesnt exists
      if (err.code === 'MODULE_NOT_FOUND') {
        return
      }

      throw err
    }
  }
  <% } %>

  // implement a simple client-side cache for API-sources
  const cache = sourcesCache.find(cache => cache.path === path)

  if (cache) {
    cache.usedCount++
    return cache.source
  }

  if (sourcesCache.length > maxCacheCount) {
    // sort most used, then shortest url first
    sourcesCache.sort((a, b) => {
      if (a.usedCount !== b.usedCount) {
        return b.usedCount - a.usedCount
      }
      return a.path < b.path ? -1 : 1
    })

    while (sourcesCache.length > maxCacheCount) {
      sourcesCache.pop()
    }
  }

  const source = await $press.get(path)

  sourcesCache.push({
    path,
    source,
    usedCount: 1
  })

  return source
}

export default async function pressMiddleware (context) {
  const { app, route, $press, params, payload } = context

  // do not run when matched is empty, not our route!
  if (!route.matched.length) {
    return
  }

  const meta = getRouteMeta(route)

  if (meta.bp === 'docs') {
    const middlewareHookReady = $press.hasHook(`${meta.id}:middleware`)

    // wait for the mode plugin to register itself if it hasnt loaded yet
    if (!middlewareHookReady) {
      $press.hook('register', async ({ id }) => {
        if (meta.id === id) {
          await pressMiddleware(context)
          $press.clearHook('register')
        }
      })
      return
    }
  }

  const middlewareContext = {
    path: route.path,
    meta
  }

  // reset layout to default
  $press.layout = 'default'

  // call middleware hooks for current mode first
  await $press.callHook(`${meta.id}:middleware`, middlewareContext)

  if (meta.source) {
    // this hook is mostly meant to fix the home page /
    // when only localized home pages like /en/ or /nl/ exists
    await $press.callHook(`${meta.id}:preparePath`, middlewareContext)

    const source = payload || await getSource($press, `api/source${middlewareContext.path}`)
    if (!source) {
      return
    }

    $press.layout = source.layout || typeToLayout[source.type] || $press.layout
    $press.source = source
  }

  $press.id = meta.id
  await $press.callHook(`${meta.id}:middlewareDone`, middlewareContext)
}
