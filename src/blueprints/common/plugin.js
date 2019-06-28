import consola from 'consola'
import Vue from 'vue'
import NuxtTemplate from './components/nuxt-template'

import middleware from '../../middleware'
import pressMiddleware from './middleware'

middleware['press'] = pressMiddleware

Vue.component('nuxt-template', NuxtTemplate)

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

function $json(url) {
  return fetch(url).then(r => r.json())
}

export default async (ctx, inject) => {
  let press
  if (process.static && process.client) {
    press = {
      get(url) {
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
    }
  } else {
    press = {
      get(url) {
        return ctx.$http.$get(url).catch(err => consola.warn(err))
      }
    }
  }

  ctx.$press = press
  inject('press', press)

  if (process.static) {
    await pressMiddleware(ctx)
  }
}
