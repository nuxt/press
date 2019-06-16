<template>
  <main>
    <template v-for="entry in latest">
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
    return { latest }
  }
}
</script>
