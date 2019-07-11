import Vue from 'vue'
import OutboundLink from './components/outbound-link-icon'
import config from '~/nuxt.press'

Vue.component('OutboundLink', OutboundLink)

export default function docsPlugin(ctx, inject) {
  const pages = JSON.parse(`<%=options.docs.$asJsonTemplate.pages%>`)

  let home = null
  const homePage = pages['/']
  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  const nav = JSON.parse(`<%=options.docs.$asJsonTemplate.nav%>`)

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
