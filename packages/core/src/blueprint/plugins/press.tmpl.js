import Vue from 'vue'
import consola from 'consola'
import NuxtStatic from '../components/nuxt-static'
import NuxtTemplate from '../components/nuxt-template'
import PressLink from '../components/press-link'
import pressMiddleware from '../middleware/press'
import { createPlugin } from 'press/core/utils'

Vue.component('NuxtStatic', NuxtStatic)
Vue.component('NuxtTemplate', NuxtTemplate)
Vue.component('PressLink', PressLink)

// TODO: remove this
const apiToStatic = {
  // Blog-only API endpoints
  'api/blog/index': '/_press/blog/index.json',
  'api/blog/archive': '/_press/blog/archive.json',
  // Slides-only API endpoints
  'api/slides/index': '/_press/slides/index.json',
  // Common API endpoints
  'api/source': path => `/_press/sources/${path}${path ? '/' : ''}index.json`
}

function $json (url) {
  return fetch(url).then(r => r.json())
}

export default createPlugin('press', async (plugin, context) => {
  if (process.static && process.client) {
    plugin.get = function get (url) {
      for (const apiPath in apiToStatic) {
        const staticPath = apiToStatic[apiPath]

        if (url.startsWith(apiPath)) {
          if (typeof staticPath === 'function') {
            const startSlice = apiPath.length + 1
            const endSlice = url.endsWith('/') ? 1 : 0
            url = url.slice(startSlice, url.length - endSlice)

            const apiUrl = staticPath(url)
            return $json(apiUrl)
          }

          return $json(staticPath)
        }
      }
    }
  } else {
    plugin.get = function get (url) {
      return context.$http.$get(url).catch(err => consola.warn(err))
    }
  }

  // this is a workaround to prevent hydration errors
  // due to middlewares not running on first load on the client
  // TODO: try to understand why returning the pressMiddleware
  // promise doesnt work and this has to be async/await
  await pressMiddleware(context)
})
