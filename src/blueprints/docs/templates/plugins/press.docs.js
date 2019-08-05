import Vue from 'vue'
import OutboundLink from 'press/docs/components/outbound-link-icon'
import config from 'press/config'

Vue.component('OutboundLink', OutboundLink)

export default function docsPlugin (ctx, inject) {
  let pages = JSON.parse(`<%= options.docs.$asJsonTemplate.pages %>`)
  const nav = JSON.parse(`<%= options.docs.$asJsonTemplate.nav %>`)

  let homePage = '/'
  if (ctx.$press.locale) {
    homePage = `/${ctx.$press.locale}`
    pages = Object.keys(pages).reduce((hash, page) => {
      if (page.startsWith(homePage)) {
        hash[page] = pages[page]
        return hash
      } else {
        return hash
      }
    }, {})
  }

  let home = null
  console.log('homePage', homePage)
  homePage = pages[homePage]
  console.log('homePage', homePage)
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
