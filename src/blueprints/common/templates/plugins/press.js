import consola from 'consola'
import Vue from 'vue'
import NuxtMiddleware from 'press/../middleware'
import NuxtStatic from 'press/common/components/nuxt-static'
import NuxtTemplate from 'press/common/components/nuxt-template'
import pressMiddleware from 'press/common/middleware/press'

NuxtMiddleware.press = pressMiddleware

Vue.component('NuxtStatic', NuxtStatic)
Vue.component('NuxtTemplate', NuxtTemplate)

const apiToStatic = {
  // Docs-only API endpoints
  'api/docs/index': '/_press/docs/index.json',
  // Blog-only API endpoints
  'api/blog/index': '/_press/blog/index.json',
  'api/blog/archive': '/_press/blog/archive.json',
  // Slides-only API endpoints
  'api/slides/index': '/_press/slides/index.json',
  // Common API endpoints
  'api/source': path => `/_press/sources/${path}.json`
}

const apiToStaticPaths = Object.keys(apiToStatic)

function $json (url) {
  return fetch(url).then(r => r.json())
}

export default async (ctx, inject) => {
  const press = ctx.$press || {}

  if (process.static && process.client) {
    press.get = function get (url) {
      for (const apiPath of apiToStaticPaths) {
        if (url.startsWith(apiPath)) {
          if (typeof apiToStatic[apiPath] === 'function') {
            return $json(apiToStatic[apiPath](url.slice(apiPath.length + 1)))
          } else {
            return $json(apiToStatic[apiPath])
          }
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
