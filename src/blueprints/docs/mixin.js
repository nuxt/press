import { trimSlash } from './utils'

export default {
  computed: {
    $page() {
      const path = trimSlash(this.$route.path) || '/'
      return this.$docs.pages[path] || {}
    }
  }
}
