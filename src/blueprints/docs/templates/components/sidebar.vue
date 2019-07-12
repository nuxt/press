<template>
  <aside class="sidebar">
    <sidebar-sections
      :data="sidebar"
      :active-path="activePath"
    />
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
    const sidebar = this.$docs.sidebar
    if (Array.isArray(sidebar)) {
      this.$sidebars = { '/': sidebar }
    } else {
      this.$sidebars = sidebar
    }

    this._sidebars = []

    // extract all sidebar paths in reverse order of length
    this._sidebarPaths = Object.keys(this.$sidebars).sort((a, b) => {
      return b.length - a.length
    })

    this.setSidebar()
  },
  computed: {
    path() {
      return this.$route.path
    },
    hash() {
      return this.$route.hash
    },
    activePath() {
      const path = trimSlash(this.path)
      return `${path}${this.hash}`
    }
  },
  watch: {
    path() {
      this.setSidebar()
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
            this._sidebars[sidebarPath] = createSidebar(this.$docs, this.$sidebars[sidebarPath], this.$docs.pages)
          }

          this.sidebar = this._sidebars[sidebarPath]
          break
        }
      }
    }
  }
}
</script>

<style>
.docs .sidebar {
  position: fixed;
  width: 18vw;
  border-right: 1px solid #e5e5e5;
  margin: 0;
  padding: 1.4rem 0 0 0;
  font-size: 1.1rem;
  text-align: left;
  overflow-y: auto;

  & ul {
    margin: 0;
    padding: 0;
  }

  & li {
    list-style-type: none;
    margin: 0px;
    margin-bottom: 3px;
    padding: 0px;
    & a.active {
      font-weight: bold;
    }
  }

  & .sidebar-title {
    display: inline-block;
    margin: 1rem 0 0.7rem 0;
  }

  & .sidebar-heading {
    margin: 0;
  }

  & .sidebar-section {
    margin: 0 0 1rem 0;

    & .sidebar-section {
      margin: 0;
    }
  }

  & li.sidebar-item,
  & li.sidebar-section .sidebar-heading {
    padding-left: 0.7rem;
  }

  & li li.sidebar-item,
  & li li.sidebar-section .sidebar-heading {
    padding-left: 1.4rem;
  }

  & li li li.sidebar-item,
  & li li li.sidebar-section .sidebar-heading {
    padding-left: 2.1rem;
  }

  & li li li li.sidebar-item {
    padding-left: 2.8rem;
  }
}
</style>
