import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'

Vue.component('OutboundLink', OutboundLink)

const pages = JSON.parse(`<%= options.docs.$asJsonTemplate.pages %>`)
const nav = JSON.parse(`<%= options.docs.$asJsonTemplate.nav %>`)

function docsMiddleware (ctx, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  let homePage = '/'
  if (ctx.$press.locale) {
    homePage = `/${ctx.$press.locale}`
  }

  let home = null
  homePage = pages[homePage]

  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  const docs = {
    ...config.docs,
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
