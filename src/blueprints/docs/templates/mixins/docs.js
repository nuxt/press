import { trimSlash } from 'press/docs/utils'

export default {
  computed: {
    $docs () {
      return this.$press.docs
    },
    $page () {
      const path = trimSlash(this.$route.path) || '/'
      return this.$docs.pages[path] || {}
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
