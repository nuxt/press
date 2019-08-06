<template>
  <aside ref="sidebar" class="sidebar" :class="sidebarClass">
    <div
      class="mobile-toggle"
      @click="toggleMobile">×</div>
    <sidebar-sections
      :data="sidebar"
      :active-path="activePath" />
  </aside>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'
import { createSidebar, tocToTree, trimSlash } from 'press/docs/utils'
import SidebarSections from 'press/docs/components/sidebar-sections'

export default {
  components: {
    SidebarSections
  },
  mixins: [docsMixin],
  data() {
    return {
      sidebar: null,
    }
  },
  created() {
    this.$sidebars = this.$docs.$sidebars

    this._sidebars = {}

    // extract all sidebar paths in reverse order of length
    this._sidebarPaths = Object.keys(this.$sidebars).sort((a, b) => {
      return b.length - a.length
    })

    this.setSidebar()
  },
  computed: {
    hash() {
      return this.$route.hash
    },
    activePath() {
      const path = trimSlash(this.path)
      return `${path}${this.hash}`
    },
    sidebarClass() {
      return this.$page.meta.sidebar === 'auto' ? 'sidebar-auto' : undefined
    }
  },
  watch: {
    path() {
      this.setSidebar()
      this.$nextTick().then(() => {
        if ([...this.$refs.sidebar.classList].includes('mobile-visible')) {
          this.toggleMobile()
        }
      })
    }
  },
  methods: {
    setSidebar() {
      const path = this.path
      let sidebar

      if (this._sidebars[path]) {
        this.sidebar = this._sidebars[path]
        return
      }

      const { meta, toc } = this.$page
      if (meta && meta.sidebar === 'auto') {
        this.sidebar = this._sidebars[path] = tocToTree(toc)
        return
      }

      for (const sidebarPath of this._sidebarPaths) {
        if (path.startsWith(sidebarPath)) {
          if (!this._sidebars[sidebarPath]) {
            this._sidebars[sidebarPath] = createSidebar(
              this.$docs.prefix,
              this.$sidebars[sidebarPath],
              this.$docs.pages,
              this.$press.locale
            )
          }

          this.sidebar = this._sidebars[sidebarPath]
          break
        }
      }
    },
    toggleMobile() {
      document.querySelector('.sidebar').classList.toggle('mobile-visible')
    }
  }
}
</script>
