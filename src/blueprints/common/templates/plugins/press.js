import consola from 'consola'
import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import NuxtStatic from 'press/common/components/nuxt-static'
import NuxtTemplate from 'press/common/components/nuxt-template'
import PressLink from 'press/common/components/press-link'
import pressMiddleware from 'press/common/middleware/press'

NuxtMiddleware.press = pressMiddleware

Vue.component('NuxtStatic', NuxtStatic)
Vue.component('NuxtTemplate', NuxtTemplate)
Vue.component('PressLink', PressLink)

const apiToStatic = {
  // Docs-only API endpoints
  // 'api/docs/index': '/_press/docs/index.json',
  // Blog-only API endpoints
  'api/blog/index': '/_press/blog/index.json',
  'api/blog/archive': '/_press/blog/archive.json',
  // Slides-only API endpoints
  'api/slides/index': '/_press/slides/index.json',
  // Common API endpoints
  'api/source': path => `/_press/sources/${path}/index.json`
}

function $json (url) {
  return fetch(url).then(r => r.json())
}

export default async (ctx, inject) => {
  // only props defined here or which are set with Vue.set are reactive
  const press = ctx.$press || Vue.observable({
    id: '',
    locale: '',
    path: ''
  })

  if (process.static && process.client) {
    press.get = function get (url) {
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
    press.get = function get (url) {
      return ctx.$http.$get(url).catch(err => consola.warn(err))
    }
  }

  if (!ctx.$press) {
    ctx.$press = press
    inject('press', press)
  }

  await pressMiddleware(ctx, true)
}
