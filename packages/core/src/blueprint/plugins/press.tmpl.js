import Vue from 'vue'
import consola from 'consola'
import { createPlugin } from 'press/core/utils'
import NuxtStatic from '../components/nuxt-static'
import NuxtTemplate from '../components/nuxt-template'
import PressLink from '../components/press-link'
import pressMiddleware from '../middleware/press'

Vue.component('NuxtStatic', NuxtStatic)
Vue.component('NuxtTemplate', NuxtTemplate)
Vue.component('PressLink', PressLink)

// TODO: remove this
const apiToStatic = {
  // Blog-only API endpoints
  <% for (const id in options.rootOptions.blogPrefixes) {
    const prefix = options.rootOptions.blogPrefixes[id]
  %>
  '<%= id %>': {
    'api/blog/index': '/_press/blog<%= prefix %>/index.json',
    'api/blog/archive': '/_press/blog<%= prefix %>/archive.json'
  },
  <% } %>
  // Slides-only API endpoints
  <% for (const id in options.rootOptions.slidesPrefixes) {
    const prefix = options.rootOptions.slidesPrefixes[id]
  %>
  '<%= id %>': {
    'api/slides/index': '/_press/slides<%= prefix %>/index.json',
  },
  <% } %>
  // Common API endpoints
  'api/source': path => `/_press/sources/${path}/index.json`
}

function getUrl(apiPaths, url) {
  for (const apiPath in apiPaths) {
    if (url.startsWith(apiPath)) {
      const staticPath = apiPaths[apiPath]

      if (typeof staticPath === 'function') {
        const startSlice = apiPath.length + 1
        const endSlice = url.endsWith('/') ? 1 : 0

        url = url.slice(startSlice, url.length - endSlice)
        return staticPath(url)
      }

      return staticPath
    }
  }
}

function $json (url) {
  return fetch(url).then(r => r.json())
}

export default createPlugin('press', async (plugin, context) => {
  plugin.get = function get (url) {
    const { route: { path, matched } } = context
    const [{ meta }] = matched || []

    let apiUrl
    if (meta && !meta.source && apiToStatic[meta.id]) {
      apiUrl = getUrl(apiToStatic[meta.id], url)
    }

    if (!apiUrl) {
      apiUrl = getUrl(apiToStatic, url)
    }

    if (process.static && process.client) {
      return $json(apiUrl)
    }

    // strip first slash
    apiUrl = apiUrl[0] === '/' ? apiUrl.slice(1) : apiUrl
    return context.$http.$get(apiUrl).catch(err => consola.warn(err))
  }

  // this is a workaround to prevent hydration errors
  // due to middlewares not running on first load on the client
  // TODO: try to understand why returning the pressMiddleware
  // promise doesnt work and this has to be async/await
  await pressMiddleware(context)
})
