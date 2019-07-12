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
import Home from 'press/docs/components/home'
import docsMixin from 'press/docs/mixins/docs'

export default {
  layout: 'docs',
  components: {
    Home
  },
  mixins: [docsMixin],
  async asyncData ({ $press, payload, error }) {
    const index = payload || await $press.get('api/source<%= options.docs.prefix || '/' %>index')
    if (!index) {
      return error({ statusCode: 404 })
    }
    return { index }
  }
}
</script>
