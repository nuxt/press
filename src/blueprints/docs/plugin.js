if (process.client) {
  window.onNuxtReady((app) => {
    const scrollBehavior = app.$router.options.scrollBehavior

    app.$router.options.scrollBehavior = (to, from, savedPosition) => {
      if (savedPosition) {
        return Promise.resolve(savedPosition)
      }

      if (app.$press.disableScrollBehavior) {
        return Promise.resolve(false)
      }

      // TODO: remove this once https://github.com/nuxt/nuxt.js/pull/6012 is released
      if (to.path === from.path && to.hash !== from.hash) {
        app.$nextTick(() => app.$emit('triggerScroll'))
      }

      return scrollBehavior(to, from, savedPosition)
    }
  })
}
