export default {
  computed: {
    locale () {
      return this.$press.locale
    },
    path () {
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
      const path = this.path
      if (this.$docs.pages[path]) {
        return this.$docs.pages[path]
      }

      const fallbackPath = this.locale ? `/${this.locale}/` : '/'
      return this.$docs.pages[fallbackPath]
    },
    $title () {
      return this.$page.meta.title || (this.$page.toc[0] && this.$page.toc[0][1]) || ''
    },
    $description () {
      return this.$page.meta.description || ''
    },
    $isHome () {
      if (!this.$docs.home) {
        return false
      }

      const path = this.path

      if (this.locale) {
        return [`/${this.locale}/`, '/'].includes(path)
      }

      return path === '/'
    }
  }
}
