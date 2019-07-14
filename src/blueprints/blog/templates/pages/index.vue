<template>
  <main>
    <h3><span>Latest</span></h3>
    <nuxt-static :source="$press.data.latest" />
    <h3><span>Recent</span></h3>
    <nuxt-static :data="$press.data.entries">
      <template v-for="entry in $press.data.entries">
        <p class="title">
          <nuxt-link :to="entry.path">
            {{ entry.title }}
            ·
            {{ entry.published.toString().slice(0, 10) }}
          </nuxt-link>
        </p>
      </template>
    </nuxt-static>
  </main>
</template>

<script>
export default {
  layout: 'blog',
  async fetch ({ $press, payload }) {
    $press.data.entries = (payload || await $press.get('api/blog/index')).slice(1)
    $press.data.latest = $press.data.entries[0].body
  }
}
</script>
