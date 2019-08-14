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
import { createSidebar, tocToTree } from 'press/docs/utils'
import SidebarSection from 'press/docs/components/sidebar-section'
import SidebarSections from 'press/docs/components/sidebar-sections'

function initSidebar() {
  let sidebar = this.$docs.sidebar

  const sidebarIsArray = Array.isArray(this.$docs.sidebar)
  if (sidebarIsArray) {
    this.$sidebars = this.$sidebars || {}
    const routePrefix = this.$press.locale ? `/${this.$press.locale}` : ''

    if (!this.$sidebars[routePrefix]) {
      if (!this.$press.locale) {
        this.$sidebars[routePrefix] = sidebar
      } else {
        const localeSidebar = sidebar.map((item) => {
          if (typeof item === 'object') {
            return {
              ...item,
              children: item.children.map(p => `${routePrefix}${p}`)
            }
          }

          if (item === '/') {
            item = ''
          }

          return `${routePrefix}${item}`
        })

        this.$sidebars[routePrefix] = localeSidebar
      }
    }
  } else {
    this.$sidebars = sidebar
  }

  // extract all sidebar paths in reverse order of length
  this._sidebarPaths = Object.keys(this.$sidebars).sort((a, b) => {
    return b.length - a.length
  })
}

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
    this._sidebars = []

    initSidebar.call(this)
    this.prepareSidebar()
  },
  computed: {
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
    sidebarClass() {
      return this.$page.meta.sidebar === 'auto' ? 'sidebar-auto' : undefined
    }
  },
  watch: {
    locale() {
      initSidebar.call(this)
    },
    normalizedPath() {
      this.prepareSidebar()

      this.$nextTick(() => {
        if (this.$refs.sidebar.classList.contains('mobile-visible')) {
          this.toggleMobile()
        }
      })
    }
  },
  methods: {
    prepareSidebar() {
      const path = this.normalizedPath
      let sidebar

      if (this._sidebars[path]) {
        this.setSidebar(this._sidebars[path])
        return
      }

      const { meta, toc } = this.$page
      if (meta && meta.sidebar === 'auto') {
        this._sidebars[path] = tocToTree(toc)
        this.setSidebar(this._sidebars[path])
        return
      }

      for (const sidebarPath of this._sidebarPaths) {
        if (path.startsWith(sidebarPath)) {
          if (!this._sidebars[sidebarPath]) {
            this._sidebars[sidebarPath] = createSidebar(
              this.$sidebars[sidebarPath],
              this.$docs.pages,
              this.$press.locale
            )
          }

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
