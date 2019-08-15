import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'

Vue.component('OutboundLink', OutboundLink)

const nav = JSON.parse(`<%= options.docs.$asJsonTemplate.nav %>`)
const pages = JSON.parse(`<%= options.docs.$asJsonTemplate.pages %>`)
const sidebars = JSON.parse(`<%= options.docs.$asJsonTemplate.sidebars %>`)

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

  // return if docs has already been set, just set home as it
  // might have changed due to the locale
  if (ctx.$press.docs) {
    ctx.$press.docs.home = home
    return
  }

  const docs = {
    ...config.docs,
    home,
    nav,
    pages,
    prefix: '<%= options.docs.$prefix %>',
    sidebars
  }

  ctx.$press.docs = docs
}

NuxtMiddleware.press.add(docsMiddleware)

export default function docsPlugin (ctx) {
  docsMiddleware(ctx, true)
}
