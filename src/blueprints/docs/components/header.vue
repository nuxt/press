<template>
  <header class="top-menu">
    <h1 class="title">{{ config.name }}</h1>

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
  border-bottom: 1px solid #e5e5e5;

  & .title {
    padding-left: 1em;
  }

  & nav.links {
    position: relative;
    right: 1em;

    & ul {
      display: flex;
      margin: 11px auto;
      list-style-type: none;

      & li {
        margin: 0;
      }

      & .nav-item {
        line-height: 3em;
        padding: 0 .5em 0 .5em;
      }
    }
  }
}
</style>
