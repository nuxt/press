import { trimSlash } from 'press/docs/utils'

export default {
  computed: {
    $docs () {
      return this.$press.docs
    },
    path () {
      return this.$route.path === '/' && this.$press.locale
        ? `/${this.$press.locale}`
        : trimSlash(this.$route.path) || '/'
    },
    $page () {
      const path = this.path
      if (this.$docs.pages[path]) {
        return this.$docs.pages[path]
      }

      // return empty object to not break stuff
      return this.$docs.pages[`/${this.$press.locale}`]
    },
    $title () {
      return this.$page.meta.title || (this.$page.toc[0] && this.$page.toc[0][1]) || ''
    },
    $description () {
      return this.$page.meta.description || ''
    },
    $isHome () {
      if (this.$press.locale) {
        return [`/${this.$press.locale}`, '/'].includes(this.$route.path) && !!this.$docs.home
      }
      return this.$route.path === '/' && !!this.$docs.home
    }
  }
}
