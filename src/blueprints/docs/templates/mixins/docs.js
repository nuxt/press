// @vue/component
export default {
  computed: {
    <% if (options.rootOptions.dev) { %>
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
    $page () {
      const path = this.normalizedPath

      // return empty placeholder to prevent errors
      if (!this.$docs || !this.$docs.pages) {
        return { meta: {} }
      }

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
      return pages[fallbackPath]
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
