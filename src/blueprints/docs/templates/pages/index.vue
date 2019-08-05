<template>
  <main>
    <home
      v-if="$isHome"
      :data="$docs.home"
      v-model="index.body"
    />
    <nuxt-template
      v-else
      tag="article"
      v-model="index.body"
    />
  </main>
</template>

<script>
import config from 'press/config'

export default {
  layout: 'docs',
  components: {
    Home
  },
  head: () => ({
    htmlAttrs: {
      class: 'docs'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: config.docs.title }
    ]
  }),
  mixins: [docsMixin],
  async asyncData ({ $press, payload, error }) {
    let sourceGet = 'api/source'
    if ($press.locale) {
      sourceGet += `/${$press.locale}`
    } else {
      sourceGet += `/index`
    }
    const index = payload || await $press.get(sourceGet)
    if (!index) {
      return error({ statusCode: 404 })
    }
    return { index }
  },
  mounted() {
    console.log('this.$isHome', this.$isHome)
  }
}
</script>
