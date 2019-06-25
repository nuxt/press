<template>
  <main>
    <h3><span>Latest</span></h3>
    <nuxt-template v-model="entries[0].body" />
    <h3><span>Recent</span></h3>
    <template v-for="entry in entries.slice(1)">
      <p class="title">
        <nuxt-link :to="entry.path">
          {{ entry.title }}
          ·
          {{ entry.published.toString().slice(0, 10) }}
        </nuxt-link>
      </p>
    </template>
  </main>
</template>

<script>
export default {
  layout: 'blog',
  async asyncData ({ $press, payload }) {
    const entries = payload || await $press.get('api/blog/index')
    return { entries }
  }
}
</script>
