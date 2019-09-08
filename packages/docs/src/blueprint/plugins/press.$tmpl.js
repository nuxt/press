import Vue from 'vue'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import {
  createPlugin,
  <% if (options.options.$hasLocales) { %>prepareLocalePath,<% } %>
  normalizedPath,
  getRouteMeta
} from 'press/core/utils'

Vue.component('OutboundLink', OutboundLink)

async function docsMiddleware ({ route, params, $press }, middlewareContext = {}) {
  const meta = middlewareContext.meta
  <% if (options.options.$hasLocales) {
  // nothing todo when locale hasnt changed
  // TODO: maybe validate params.locale again, shouldnt be necessary though
  %>
  const locale = params.locale || `<%= options.options.$locales[0].code %>`
  <% } %>

  if ($press.id === meta.id<% if (options.options.$hasLocales) { %> && locale === $press.locale<% } %>) {
    return
  }

  const options = $press[`<%= options.id %>`]

  const shouldLoadConfig = !options<% if (options.options.configPerLocale) { %> || !options.pages[locale]<% } %>

  let config
  if (shouldLoadConfig) {
    config = await import(
      /* webpackPreload: true */
      `./config.<%= options.id %><%= options.options.configPerLocale ? '.${locale}': '' %>`
    )
  }

  let home
  const homePath = <% if (options.options.$hasLocales) { %>locale ? `/${locale}/` : <% } %>'/'
  const homePage = (config ? config.pages : options.pages<%= options.options.configPerLocale ? '[locale]': '' %>)[homePath]
  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  // return if docs has already been set, just set home as it
  // might have changed due to the locale
  if (options) {
    options.home = home
    <% if (options.options.configPerLocale) { %>
    if (!config) {
      return
    }
    if (config.nav) {
      options.nav[locale] = config.nav
    }
    if (config.pages) {
      options.pages[locale] = config.pages
      options.sidebars[locale] = config.sidebars
    }
    <% } %>
    return
  }

  const { nav, pages, sidebars } = config
  const docs = {
    ready: true,
    blueprint: '<%= options.options.blueprint %>',
    title: `<%= options.options.title %>`,
    configPerLocale: <%= options.options.configPerLocale ? 'true' : 'false' %>,
    prefix: '<%= options.options.prefix %>',
    home,
    <% if (options.options.$hasLocales) { %>
    locales: <%= JSON.stringify(options.options.$locales).replace(/"/g, '\'') %>,
    <% } %>
    nav<%= options.options.configPerLocale ? `: { [locale]: nav }` : '' %>,
    pages<%= options.options.configPerLocale ? `: { [locale]: pages }` : '' %>,
    sidebars<%= options.options.configPerLocale ? `: { [locale]: sidebars }` : '' %>
  }

  $press[`<%= options.id %>`] = docs
}

export default createPlugin('press', (plugin, context) => {
  return plugin.register({
    id: `<%= options.id %>`,
    middleware: (middlewareContext) => docsMiddleware(context, middlewareContext),
    <% if (options.options.$hasLocales) { %>
    preparePath: (middlewareContext) => prepareLocalePath(context, middlewareContext),
    <% } %>
    done: ({ locale }) => {
      const { $press, route, params } = context
      <% if (options.options.$hasLocales) { %>
      $press.locale = params.locale || locale
      <% } %>
      $press.path = normalizedPath(route.path, $press[`<%= options.id %>`].prefix, $press.locale)
    }
  })
})
