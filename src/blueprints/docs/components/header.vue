<template>
  <header class="top-menu">
    <nuxt-link :to="config.prefix" class="home-link">
      {{ config.title }}
    </nuxt-link>

    <nav class="links">
      <ul>
        <li
          v-for="({ text, link }, idx) in config.nav"
          :key="`topmenu-${idx}`"
          class="nav-item">
          <a
            v-if="isExternal(link)"
            :href="link"
            target="_blank">
            {{ text }}
          </a>
          <nuxt-link
            v-else
            :class="activeClass"
            :to="link">
            {{ text }}
          </nuxt-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
import config from '~/nuxt.press'

console.log('config', config)

export default {
  data: () => ({
    config: config.docs
  }),
  methods: {
    activeClass(link) {
      return this.$route.path.startsWith(link) ? 'active' : ''
    },
    isExternal(link) {
      return link.startsWith('http') || link.startsWith('//')
    }
  }
}
</script>

<style>
.top-menu {
  display: flex;
  justify-content: space-between;
  padding: .7rem 1rem;

  & .home-link {
    font-size: 1.5rem;
    font-weight: bold;
    vertical-align: middle;
    line-height: 1.6rem;
    padding-left: 1rem;
  }

  & nav.links {
    position: relative;
    right: 1rem;

    & ul {
      display: flex;
      margin: 0;
      list-style-type: none;

      & li {
        margin: 0;
      }

      & .nav-item {
        line-height: 1.5rem;
        padding: 0 .5rem 0 .5rem;
      }
    }
  }
}
</style>
