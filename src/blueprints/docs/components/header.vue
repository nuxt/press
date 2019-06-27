<template>
  <header class="top-menu">
    <nuxt-link to="/" class="home-link">{{ config.title }}</nuxt-link>

    <nav class="links">
      <!-- internal links, starting with /... -->
      <ul v-if="links">
        <li
          v-for="(link, t) in config.top.links"
          :key="`topmenu-${t}`"
          class="nav-item"
        >
          <nuxt-link
            :class="[Object.values(link)[0] === `${$route.path}${$route.hash}` ? 'active' : '']"
            :to="Object.values(link)[0]">
            {{ Object.keys(link)[0] }}
          </nuxt-link>
        </li>
      </ul>
      <!-- external links, starting with http... -->
      <ul v-if="external">
        <li
          v-for="(link, t) in config.top.external"
          :key="`topmenu-${t}`"
          class="nav-item"
        >
          <a
            :class="[Object.values(link)[0] === `${$route.path}${$route.hash}` ? 'active' : '']"
            :href="Object.values(link)[0]">
            {{ Object.keys(link)[0] }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
import { docs as config } from '~/nuxt.press.json'

export default {
  data: () => ({
    config,
    external: config.top.external && config.top.external.length,
    links: config.top.links && config.top.links.length
  })
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
