import Vue from 'vue'
import Hookable from 'hable/dist/hable.esm.js'

export function normalizedPath (path = '', prefix, locale) {
  if (prefix) {
    path = path.substr(prefix.length)
  }

  if ((!path || path === '/') && locale) {
    return `/${locale}/`
  }

  if (!path.endsWith('/')) {
    path = `${path}/`
  }
  return path
}

export function getRouteMeta (route) {
  const { meta = {} } = route.matched.find(r => r.name && r.name.startsWith('source-')) || {}
  return meta
}

// this functions creates the basic nuxt/press plugin dynamically
// so it doesnt matter which plugin file is loaded first
export function createPlugin (id, extendPlugin) {
  return function _createPlugin (context, inject) {
    const pluginId = `$${id}`

    if (!context[pluginId]) {
      // only props defined here or which are set with Vue.set are reactive
      const plugin = Vue.observable({
        id: '',
        locale: '',
        path: ''
      })

      const bus = new Hookable()

      // TODO: this should be moved to mode specific middleware
      // its used in eg blog but prevents using multiple instances
      plugin.data = {}

      plugin.hook = bus.hook.bind(bus)
      plugin.callHook = bus.callHook.bind(bus)
      plugin.clearHook = bus.clearHook.bind(bus)
      plugin.hasHook = (hookName) => {
        return Array.isArray(bus._hooks[hookName]) && bus._hooks[hookName].length > 0
      }

      plugin.register = ({ id, middleware, preparePath, done }) => {
        plugin.hook(`${id}:middleware`, middleware)

        if (preparePath) {
          plugin.hook(`${id}:preparePath`, preparePath)
        }

        if (done) {
          plugin.hook(`${id}:middlewareDone`, done)
        }

        return plugin.callHook('register', { id })
      }

      context[pluginId] = plugin
      inject(id, plugin)
    }

    return extendPlugin(context[pluginId], context)
  }
}

export function prepareLocalePath ({ $press, params }, middlewareContext) {
  if (!params.locale) {
    const config = $press[middlewareContext.meta.id]

    // use default locale
    const [locale] = config.locales

    middlewareContext.locale = locale.code
    middlewareContext.path = `${middlewareContext.path}${middlewareContext.path.endsWith('/') ? '' : '/'}${locale.code}`
  }
}
