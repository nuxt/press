export default {
  computed: {
    locale () {
      return this.$press.locale
    },
    normalizedPath () {
      let path = this.$route.path
      if (this.$docs.prefix) {
        path = path.substr(this.$docs.prefix.length)
      }

      if (path === '/' && this.locale) {
        return `/${this.locale}/`
      }

      return path || '/'
    },
    $docs () {
      return this.$press.docs
    },
    $page () {
      const path = this.normalizedPath
      if (this.$docs.pages[path]) {
        return this.$docs.pages[path]
      }

      const fallbackPath = this.locale ? `/${this.locale}/` : '/'
      return this.$docs.pages[fallbackPath]
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
