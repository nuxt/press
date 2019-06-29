<template>
  <nav class="sidebar">
    <ul>
      <li
        v-for="([level, name, url], t) in sidebar"
        :key="`topic-${t}`"
        :class="{ [`h${level}`]: true }"
      >
        <nuxt-link
          class="sidebar-link"
          :class="{ active: url === activePath }"
          :to="url">
          {{ name }}
        </nuxt-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import config from '~/nuxt.press'

export default {
  data() {
    return {
      sidebar: null,
      _sidebarPaths: []
    }
  },
  async beforeMount() {
    // extract all sidebar paths in reverse order of length
    this._sidebarPaths = Object.keys(config.docs.sidebars).sort((a, b) => {
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
      return `${this.$route.path}${this.hash}`
    }
  },
  watch: {
    path() {
      this.setSidebar()
    },
    hash(hash) {
      if (!hash) {
        window.scrollTo(0, 0)
        return
      }

      const heading = document.querySelector(hash)
      if (heading) {
        heading.scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'})
      }
    }
  },
  methods: {
    setSidebar() {
      const path = this.path

      for (const sidebarPath of this._sidebarPaths) {
        if (path.startsWith(sidebarPath)) {
          this.sidebar = config.docs.sidebars[sidebarPath]
          break
        }
      }
    }
  }
}
</script>

<style>
.docs .sidebar {
  width: 18vw;
  border-right: 1px solid #e5e5e5;
  margin: 0;
  padding: 1.4rem 1.1rem 0 1.1rem;
  text-align: left;
  overflow-y: auto;

  & ul {
    margin: 0;
    padding: 0;
  }

  & li {
    list-style-type: none;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
    & a.active {
      font-weight: bold;
    }
  }

  & .h1 {
    font-size: 1.3rem;
    margin-left: .7rem;
  }

  & .h2 {
    font-size: 1.2rem;
    margin-left: 1.4rem;
  }

  & .h3 {
    font-size: 1.1rem;
    margin-left: 2.1rem;
  }

  & .h4 {
    font-size: 1rem;
    margin-left: 2.8rem;
  }
}
</style>
