import { trimSlash } from 'press/docs/utils'

export default {
  computed: {
    $docs () {
      return this.$press.docs
    },
    $page () {
      let path = trimSlash(this.$route.path) || '/'

      if (path === '/' && this.$press.locale) {
        path += this.$press.locale
      }

      if (this.$docs.pages[path]) {
        return this.$docs.pages[path]
      }

      // return empty object to not break stuff
      return this.$docs.pages['/']
    },
    $title () {
      return this.$page.meta.title || (this.$page.toc[0] && this.$page.toc[0][1]) || ''
    },
    $description () {
      return this.$page.meta.description || ''
    },
    $isHome () {
      return this.$route.path === '/' && !!this.$docs.home
    }
  }
}
