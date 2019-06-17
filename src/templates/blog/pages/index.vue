<template>
  <main>
    <nuxt-markdown v-model="latest[0].body" />
    <template v-for="entry in latest.slice(1)">
      <p class="title">
        <nuxt-link :to="entry.path">{{ entry.title }}</nuxt-link>
      </p>
    </template>
  </main>
</template>

<script>
export default {
  layout: 'blog',
  async asyncData ({ $press, payload }) {
    const latest = payload || await $press.get('api/blog/index')
    console.log('latest[0].body', latest[0].body)
    return { latest }
  }
}
</script>
