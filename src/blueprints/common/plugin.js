import consola from 'consola'
import Vue from 'vue'
import NuxtTemplate from './components/nuxt-template'

Vue.component('nuxt-template', NuxtTemplate)

const apiToStatic = {
  // Docs-only API endpoints
  'api/docs/index': '/press/static/docs/index.json',
  // Blog-only API endpoints
  'api/blog/index': '/press/static/blog/index.json',
  'api/blog/archive': '/press/static/blog/archive.json',
  // Slides-only API endpoints
  'api/slides/index': '/press/static/slides/index.json',
  // Common API endpoints
  'api/source': path => `/press/static/sources/${path}.json`
}

const apiToStaticPaths = Object.keys(apiToStatic)

function $json(url) {
  return fetch(url).then(r => r.json())
}

export default (ctx, inject) => {
  let press

  if (process.static && process.client) {
    press = {
      sources: {},
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
      sources: {},
      get(url) {
        return ctx.$http.$get(url).catch(err => consola.warn(err))
      }
    }
  }

  ctx.$press = press
  inject('press', press)
}
