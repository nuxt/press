// @vue/component
export default {
  computed: {
    <% if (options.dev) { %>
    $press_DEV_ONLY () {
      return this.$press
    },
    <% } %>
    locale () {
      return this.$press.locale
    },
    normalizedPath () {
      return this.$press.path
    },
    $docs () {
      const docsId = this.$press.id
      const docsConfig = this.$press[docsId]

      if (docsId === 'docs' || (docsConfig && docsConfig.blueprint === 'docs')) {
        return docsConfig
      }

      // TODO: find a better way for this
      // return empty placeholder to prevent errors
      // as observers in lower components are triggered
      // before eg the layout had time to disable the sidebar
      return {}
    },
    $nav () {
      if (this.$docs.configPerLocale) {
        return this.$docs.nav[this.locale]
      }

      return this.$docs.nav
    },
    $page () {
      // return empty placeholder to prevent errors
      if (!this.$docs || !this.$docs.pages) {
        return { meta: {} }
      }

      const path = this.normalizedPath.toLowerCase()

      let page
      if (this.$docs.configPerLocale) {
        page = this.$docs.pages[this.locale][path]
      } else {
        page = this.$docs.pages[path]
      }

      if (page) {
        return page
      }

      const fallbackPath = this.locale ? `/${this.locale}/` : '/'
      if (this.$docs.pages[fallbackPath]) {
        return this.$docs.pages[fallbackPath]
      }

      // return empty placeholder to prevent errors
      return { meta: {} }
    },
    $isHome () {
      if (!this.$docs.home) {
        return false
      }

      const path = this.normalizedPath

      if (this.locale) {
        return [`/${this.locale}/`, '/'].includes(path)
      }

      return path === '/'
    }
  }
}
