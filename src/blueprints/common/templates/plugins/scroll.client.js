function scrollTop(el) {
  let top = 0

  do {
    top += parseInt(el.offsetTop)
    el = el.offsetParent
  } while (el)

  return top
}

if (process.client) {
  const header = document.querySelector('#nuxt-press > header')
  const headerHeight = (header && parseInt(header.offsetHeight)) || 0

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
        const el = document.querySelector(to.hash)
        if (el) {
          const top = scrollTop(el)
          return Promise.resolve({ x: 0, y: Math.max(0, top - headerHeight - 14) })
        }

        app.$nextTick(() => app.$emit('triggerScroll'))
      }

      return scrollBehavior(to, from, savedPosition)
    }
  })
}
