<template>
  <header class="top-menu">
    <nuxt-link to="/" class="home-link">{{ config.name }}</nuxt-link>

    <nav class="links">
      <ul v-if="config.topMenu">
        <li
          v-for="({ name, url }, t) in config.topMenu"
          :key="`topmenu-${t}`"
          class="nav-item"
        >
          <nuxt-link
            :class="[url === `${$route.path}${$route.hash}` ? 'active' : '']"
            :to="url">
            {{ name }}
          </nuxt-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
import config from '~/nuxt.press.json'

export default {
  data() {
    return {
      config
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
