// Credit: this component is largely adapted
// from VuePress to maintain commonality

<template>
  <main class="home" aria-labelledby="main-title">
    <header class="hero">
      <img
        v-if="data.heroImage"
        :src="data.heroImage"
        :alt="data.heroAlt || 'hero'">

      <h1 v-if="data.heroText !== null" id="main-title">{{ data.heroText || meta.title }}</h1>

      <p class="description">
        {{ data.tagline || meta.description }}
      </p>

      <p
        v-if="data.actionText && data.actionLink"
        class="action">
        <nav-link
          class="action-button"
          :item="actionLink" />
      </p>
    </header>

    <div
      v-if="data.features && data.features.length"
      class="features">
      <div
        class="feature"
        v-for="(feature, index) in data.features"
        :key="index">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.details }}</p>
      </div>
    </div>

    <nuxt-template
      class="theme-default-content custom"
      v-model="value" />

    <div
      v-if="data.footer"
      class="footer">
      {{ data.footer }}
    </div>

    <div class="lang-select">
      <select
        v-if="$press.locales"
        v-model="lang"
        @change="(e) => $router.push(`/${e.target.value}/`)">
        <option
          v-for="locale in $press.locales"
          :key='`locale-${locale.code}`'
          :value="locale.code">{{ locale.name }}</option>
      </select>
    </div>

  </main>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'
import NavLink from 'press/docs/components/nav-link'

export default {
  components: {
    NavLink
  },
  mixins: [docsMixin],
  props: {
    data: {
      type: Object,
      required: true
    },
    meta: {
      type: Object,
      default: () => ({
        title: '',
        description: ''
      })
    },
    value: {
      type: String,
      required: true
    }
  },
  watch: {
    route () {
      this.lang = this.$press.locale
    }
  },
  data () {
    return {
      lang: this.$press.locale
    }
  },
  computed: {
    actionLink () {
      return {
        link: this.data.actionLink,
        text: this.data.actionText
      }
    }
  }
}
</script>
