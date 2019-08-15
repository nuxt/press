<template>
  <header class="top-menu">
    <div
      class="mobile-toggle"
      @click="toggleMobile">☰</div>

    <nuxt-link :to="`${$docs.prefix}/`" class="home-link">
      {{ $docs.title }}
    </nuxt-link>

    <nav class="nav-right">
      <lunr-search :locale="locale" class="search">
        <template v-slot:default="{ result, index, maxScore, meta }">
          <nuxt-link v-if="meta" :to="meta.to" role="menuitem">
            {{ meta.title }}
            <span class="text-right">{{ Math.round(100 * result.score / maxScore) }}%</span>
          </nuxt-link>
        </template>
      </lunr-search>

      <select
        v-if="$press.locales"
        v-model="lang"
        aria-label="Change locale"
      >
        <option
          v-for="locale in $press.locales"
          :key='`locale-${locale.code}`'
          :value="locale.code">{{ locale.name }}</option>
      </select>

      <ul class="links">
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
    NavLink,
    LunrSearch: () => import('lunr-module/search')
  },
  mixins: [docsMixin],
  data () {
    return {
      lang: this.$press.locale
    }
  },
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
    },
    getPageTitle(path) {
      const page = this.$docs.pages[path]
      if (!page || !page.toc || !page.toc.length) {
        return 'unknown page'
      }

      return page.toc[0][1]
    }
  }
}
</script>
