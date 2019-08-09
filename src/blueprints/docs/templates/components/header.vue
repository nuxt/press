<template>
  <header class="top-menu">
    <div
      class="mobile-toggle"
      @click="toggleMobile">☰</div>

    <nuxt-link :to="`${$docs.prefix}/`" class="home-link">
      {{ $docs.title }}
    </nuxt-link>

    <nav class="links">
      <select
        v-if="$press.locales"
        v-model="lang">
        <option
          v-for="locale in $press.locales"
          :key='`locale-${locale.code}`'
          :value="locale.code">{{ locale.name }}</option>
      </select>
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
  data () {
    return {
      lang: this.$press.locale
    }
  },
  mixins: [docsMixin],
  watch: {
    lang(newLocale, oldLocale) {
      const newRoute = this.$route.path.replace(`/${oldLocale}/`, `/${newLocale}/`)
      this.$router.push(newRoute)
    }
  },
  methods: {
    activeClass(link) {
      return this.$route.path.startsWith(link) ? 'active' : ''
    },
    toggleMobile() {
      document.querySelector('.sidebar').classList.toggle('mobile-visible')
    }
  }
}
</script>
