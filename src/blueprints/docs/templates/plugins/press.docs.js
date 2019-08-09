import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'
import { normalizePaths, trimSlash } from 'press/common/utils'

Vue.component('OutboundLink', OutboundLink)

const pages = JSON.parse(`<%= options.docs.$asJsonTemplate.pages %>`)
const nav = JSON.parse(`<%= options.docs.$asJsonTemplate.nav %>`)

function docsMiddleware (ctx, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  let home = null
  const homePath = ctx.$press.locale ? `/${ctx.$press.locale}/` : '/'
  const homePage = pages[homePath]

  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  if (ctx.$press.docs) {
    ctx.$press.docs.home = home
    return
  }

  const docs = {
    ...config.docs,
    prefix: trimSlash(config.docs.prefix),
    sidebar: normalizePaths(config.docs.sidebar),
    nav,
    home,
    pages
  }

  ctx.$press.docs = docs
}

NuxtMiddleware.press.add(docsMiddleware)

export default function docsPlugin (ctx) {
  docsMiddleware(ctx, true)
}
