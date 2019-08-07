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
import SidebarSections from 'press/docs/components/sidebar-sections'

function prepareSidebar() {
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
  mixins: [docsMixin],
  data() {
    return {
      sidebar: null,
    }
  },
  created() {
    this._sidebars = []

    prepareSidebar.call(this)
    this.setSidebar()
  },
  computed: {
    hash() {
      return this.$route.hash
    },
    activePath() {
      return `${this.path}${this.hash}`
    },
    sidebarClass() {
      return this.$page.meta.sidebar === 'auto' ? 'sidebar-auto' : undefined
    }
  },
  watch: {
    locale() {
      prepareSidebar.call(this)
    },
    path() {
      this.setSidebar()

      this.$nextTick(() => {
        if (this.$refs.sidebar.classList.contains('mobile-visible')) {
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
      this.$refs.sidebar.classList.toggle('mobile-visible')
    }
  }
}
</script>
