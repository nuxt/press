import { getRouteMeta } from 'press/common/utils'

const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const maxCacheCount = 5
const sourcesCache = []
const extraMiddlewares = []

async function getSource ($press, path) {
  if (path.startsWith('api/source/')) {
    const source = await import(
      /* webpackInclude: /\.json$/ */
      <% if (options.rootOptions.dev) { %>
      /* webpackChunkName: 'source-[request]' */
      <% } %>
      /* webpackPreload: true */
      `../../static/sources/${path.substr(11)}`
    )

    return source
  }

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

export default async function pressMiddleware (ctx, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  const { app, route, $press, params, payload } = ctx

  // do not run when matched is empty, not our route!
  if (!route.matched.length) {
    return
  }

  const meta = getRouteMeta(route)

  const middlewareContext = {
    <% if (options.rootOptions.i18n) { %>
    localeChanged: $press.locale !== params.locale,
    locale: $press.locale,
    <% } %>
    meta
  }

  $press.data = {}
  $press.layout = 'default'

  <% if (options.rootOptions.i18n) { %>
  $press.locales = app.i18n.locales

  // only change locale if it wasnt set or the current route doesnt use the set locale
  if (!middlewareContext.locale || middlewareContext.localeChanged) {
    const locale = app.i18n.locales.find(locale => locale.code === params.locale)

    if (locale) {
      app.i18n.locale = locale.code
      middlewareContext.locale = locale.code
    } else {
      middlewareContext.locale = app.i18n.locale
    }
  }
  <% } %>

  let shouldHaveSource = meta.source
  if (shouldHaveSource) {
    let source = payload

    if (!source) {
      let sourcePath = route.path

      <% if (options.rootOptions.i18n) { %>
      if (middlewareContext.locale) {
        // dont add a locale for sources with id 'common', those are nuxt pages
        const shouldAddLocale = !params.locale && meta.id !== 'common'

        if (shouldAddLocale) {
          if (!sourcePath.endsWith('/')) {
            sourcePath += '/'
          }
          sourcePath = `${sourcePath}${middlewareContext.locale}`
        }
      }
      <% } %>

      source = await getSource($press, `api/source${sourcePath}`)
    }

    if (!source) {
      return
    }

    $press.layout = source.layout || typeToLayout[source.type]
    $press.source = source
  }

  const delayedCallbacks = []
  for (const extraMiddleware of extraMiddlewares) {
    const cb = await extraMiddleware(ctx, middlewareContext)
    if (cb) {
      delayedCallbacks.push(cb)
    }
  }

  $press.id = meta.id
  <%
  // the locale should only be changed when all middlewares have run
  // because watchers for the locale will otherwise trigger
  // before the middlewares have updated all settings
  // (eg for docs we might need to download a config chunk first)
  if (options.rootOptions.i18n) { %>
  $press.locale = middlewareContext.locale
  <% } %>

  await Promise.all(delayedCallbacks.map(cb => cb()))
}

pressMiddleware.add = middleware => extraMiddlewares.push(middleware)
