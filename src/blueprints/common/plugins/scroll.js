window.onNuxtReady((app) => {
  const scrollBehavior = app.$router.options.scrollBehavior

  app.$router.options.scrollBehavior = (to, from, savedPosition) => {
    if (savedPosition) {
      return Promise.resolve(savedPosition)
    }

    if (app.$press.disableScrollBehavior) {
      return Promise.resolve(false)
    }

    return scrollBehavior(to, from, savedPosition)
  }
})
