import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'
import { normalizedPath, getRouteMeta } from 'press/common/utils'

Vue.component('OutboundLink', OutboundLink)

const pluginId = '<%= options.id %>'

// TODO: nav should probably be moved to config.json
const nav = JSON.parse(`<%= options.options.$asJsonTemplate.nav %>`)

async function docsMiddleware ({ route, $press }, { meta, locale, localeChanged } = {}, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  if (!meta) {
    meta = getRouteMeta(route)
  }

  if (meta.id !== pluginId) {
    return
  }

  const options = $press[pluginId]
  <%
  // this is a callback passed back to common middleware
  // because the path needs to be changed _after_ the locale
  // to make sure the observers are triggered in the right order
  // But the locale cannot already be changed before
  // calling the docs middleware (because the config chunk might
  // need to load first)
  %>
  const middlewareCallback = (_options) => {
    $press.path = normalizedPath(route.path, (_options || options).prefix, locale)
  }

  // there is nothing for us to do here
  if (options && !localeChanged) {
    return middlewareCallback
  }

  let pages
  let sidebars
  <% if (options.options.configPerLocale) { %>
  if (locale && (!options || (localeChanged && !options.pages[locale]))) {
  <% } else { %>
  if (!options) {
  <% } %>
    ({ pages, sidebars } = await import(
      /* webpackPreload: true */
      `./config.<%= options.id %><%= options.options.configPerLocale ? '.${locale}': '' %>`
    ))
  }

  let home = null
  const homePath = locale ? `/${locale}/` : '/'
  const homePage = (pages || options.pages<%= options.options.configPerLocale ? '[locale]': '' %>)[homePath]

  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  // return if docs has already been set, just set home as it
  // might have changed due to the locale
  if (options) {
    options.home = home
    <% if (options.options.configPerLocale) { %>
    if (pages) {
      options.pages[locale] = pages
      options.sidebars[locale] = sidebars
    }
    <% } %>
    return middlewareCallback
  }

  const docs = {
    ready: true,
    blueprint: '<%= options.options.blueprint %>',
    title: `<%= options.options.title %>`,
    configPerLocale: <%= options.options.configPerLocale ? 'true' : 'false' %>,
    prefix: '<%= options.options.$normalizedPrefix %>',
    home,
    nav,
    pages<%= options.options.configPerLocale ? `: { [locale]: pages }` : '' %>,
    sidebars<%= options.options.configPerLocale ? `: { [locale]: sidebars }` : '' %>
  }

  $press[pluginId] = docs

  return middlewareCallback(docs)
}

NuxtMiddleware.press.add(docsMiddleware)

export default function docsPlugin (ctx) {
  const middlewareContext = {
    <%
    // make sure to add the default locale or we will have hydration error
    if (options.rootOptions.i18n) { %>
    locale: ctx.$press.locale,
    <% } %>
  }
  return docsMiddleware(ctx, middlewareContext, true)
}
