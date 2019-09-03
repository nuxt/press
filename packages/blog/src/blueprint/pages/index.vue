<template>
  <main>
    <h3><span>Latest</span></h3>
    <nuxt-static :source="$press.data.latest" />
    <h3><span>Recent</span></h3>
    <nuxt-static :data="$press.data.entries">
      <template v-for="entry in $press.data.entries">
        <p class="title">
          <press-link :to="entry.path">
            {{ entry.title }}
            ·
            {{ entry.published.toString().slice(0, 10) }}
          </press-link>
        </p>
      </template>
    </nuxt-static>
  </main>
</template>

<script>
export default {
  layout: 'blog',
  async fetch ({ $press, payload }) {
    const index = payload || await $press.get('api/blog/index')

    $press.data.latest = index[0].body
    $press.data.entries = index.slice(1)
  }
}
</script>
