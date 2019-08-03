import Vue from 'vue'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'

Vue.component('OutboundLink', OutboundLink)

export default function docsPlugin (ctx, inject) {
  const pages = JSON.parse(`<%= options.docs.$asJsonTemplate.pages %>`)
  const nav = JSON.parse(`<%= options.docs.$asJsonTemplate.nav %>`)

  let locale
  if (ctx.app.i18n) {
    locale = ctx.app.i18n.locale
  }

  let home = null
  const homePage = pages[`/${locale && `${locale}`}`]
  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  const docs = {
    ...config.docs,
    nav,
    home,
    pages
  }

  if (ctx.$press) {
    ctx.$press.docs = docs
    return
  }

  const press = { docs }
  ctx.$press = press
  inject('press', press)
}
