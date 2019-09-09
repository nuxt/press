<template>
  <aside
    ref="sidebar"
    class="sidebar"
    :class="sidebarClass"
    aria-label="Main navigation"
  >
    <div
      class="mobile-toggle"
      @click="toggleMobile"
      aria-hidden="true"
    >×</div>
    <sidebar-sections
      :data="sidebar"
      :active-path="activePath"
      :active-page="activePageHash"
    />
  </aside>
</template>

<script>
import SidebarSection from 'press/docs/components/sidebar-section'
import SidebarSections from 'press/docs/components/sidebar-sections'
import docsMixin from 'press/docs/mixins/docs'

export default {
  components: {
    SidebarSections
  },
  provide: {
    components: {
      SidebarSections,
      SidebarSection
    }
  },
  mixins: [docsMixin],
  data() {
    return {
      sidebar: [],
    }
  },
  created() {
    this.prepareSidebar()
    this.changeSidebar()
  },
  computed: {
    pressId() {
      return this.$press.id
    },
    hash() {
      return this.$route.hash
    },
    activePath() {
      let path = this.normalizedPath
      if (!path.endsWith('/')) {
        path =`${path}/`
      }
      return `${path}${this.hash}`
    },
    // this variable is used to make sure that if we browse to a page
    // without any hash in the url, the first header of the page will
    // still be active in the sidebar
    activePageHash() {
      if (this.activePath.includes('#')) {
        return this.activePath
      }

      return `${this.activePath}${this.$page.hash}`
    },
    sidebarClass() {
      return this.$page.meta.sidebar === 'auto' ? 'sidebar-auto' : undefined
    }
  },
  watch: {
    locale() {
      if (this.$docs.ready && this.$docs.configPerLocale) {
        this.prepareSidebar()
        this.changeSidebar()
      }
    },
    pressId () {
      if (this.$docs.ready) {
        this.prepareSidebar()
        this.changeSidebar()
      }
    },
    normalizedPath() {
      if (this.$docs.ready) {
        this.changeSidebar()
      }

      this.$nextTick(() => {
        if (this.$refs.sidebar.classList.contains('mobile-visible')) {
          this.toggleMobile()
        }
      })
    }
  },
  methods: {
    prepareSidebar() {
      /*console.log('normalizedPath', this.normalizedPath)
      console.log(this.$press)
      console.log(this.$docs)*/

      if (this.$docs.configPerLocale) {
        this._sidebars = this.$docs.sidebars[this.locale]
      } else {
        this._sidebars = this.$docs.sidebars
      }

      // extract all sidebar paths in reverse order of length
      this._sidebarPaths = Object.keys(this._sidebars).sort((a, b) => {
        return b.length - a.length
      })
    },
    changeSidebar() {
      const path = this.normalizedPath.toLowerCase()

      const { meta } = this.$page
      if (meta && meta.sidebar === 'auto') {
        this.setSidebar(this._sidebars[path])
        return
      }

      for (const sidebarPath of this._sidebarPaths) {
        if (path.startsWith(sidebarPath)) {
          this.setSidebar(this._sidebars[sidebarPath])
          break
        }
      }
    },
    setSidebar(sidebar) {
      this.sidebar = sidebar
    },
    toggleMobile() {
      this.$refs.sidebar.classList.toggle('mobile-visible')
    }
  }
}
</script>
