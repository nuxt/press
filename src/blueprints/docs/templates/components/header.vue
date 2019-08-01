<template>
  <header class="top-menu">
    <nuxt-link :to="$docs.prefix" class="home-link">
      {{ $docs.title }}
    </nuxt-link>

    <nav class="links">
      <ul>
        <li
          v-for="(item, idx) in $docs.nav"
          :key="`topmenu-${idx}`"
          class="nav-item">
          <nav-link
            :class="activeClass(item.link)"
            :item="item" />
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'
import NavLink from 'press/docs/components/nav-link'

export default {
  components: {
    NavLink
  },
  mixins: [docsMixin],
  methods: {
    activeClass(link) {
      return this.$route.path.startsWith(link) ? 'active' : ''
    }
  }
}
</script>
