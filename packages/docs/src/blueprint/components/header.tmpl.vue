<template>
  <header class="top-menu">
    <div
      class="mobile-toggle"
      @click="toggleMobile">☰</div>

    <nuxt-link :to="`${$docs.prefix}/`" class="home-link">
      {{ $docs.title }}
    </nuxt-link>

    <nav class="nav-right">
      <% if (options.options.search) { %>
      <lunr-search :locale="locale" class="search">
        <template v-slot:default="{ result, index, maxScore, meta }">
          <nuxt-link v-if="meta" :to="meta.to" role="menuitem">
            {{ meta.title }}
            <span class="text-right">{{ Math.round(100 * result.score / maxScore) }}%</span>
          </nuxt-link>
        </template>
      </lunr-search>
      <% } %>

      <% if (options.options.$hasLocales) { %>
      <select
        v-if="$docs.locales"
        v-model="lang"
        aria-label="Change locale"
      >
        <option
          v-for="locale in $docs.locales"
          :key='`locale-${locale.code}`'
          :value="locale.code">{{ locale.name }}</option>
      </select>
      <% } %>

      <ul class="links">
        <li
          v-for="(item, idx) in $nav"
          :key="`topmenu-${idx}`"
          class="nav-item">
          <nav-link
            :class="activeClass(item.link)"
            :no-prefix="true"
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
    <% if (options.options.search) { %>
    LunrSearch: () => import('lunr-module/search'),
    <% } %>
    NavLink
  },
  mixins: [docsMixin],
  data () {
    return {
      lang: this.$press.locale
    }
  },
  watch: {
    lang(newLocale, oldLocale) {
      let { href: newPath } = this.$router.resolve({
        name: this.$route.name,
        params: {
          locale: newLocale,
          source: this.$route.params.source
        }
      })

      if (newPath) {
        // vue-router doest know that our source param can only contains /
        // as path separator and encodes those
        newPath = newPath.replace(/%2F/g, '/')
      } else {
        // fallback to replacing it router.resolve didnt work somehow
        newPath = this.$route.path.replace(`/${oldLocale}/`, `/${newLocale}/`)
        // if nothing changed, the current route is the home route
        if (newPath === this.$route.path) {
          newPath = this.$route.path.replace(/\/$/, `/${newLocale}/`)
        }
      }

      this.$router.push(newPath)
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
