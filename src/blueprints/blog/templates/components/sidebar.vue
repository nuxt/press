<template>
  <div class="sidebar">
    <div class="about">
      <p>{{ title }}</p>

      <div class="text-links">
        <press-link
          v-for="(link, i) in links"
          :key="`link-${i}`"
          :to="Object.values(link)[0]">
          {{ Object.keys(link)[0] }}
        </press-link>
      </div>
    </div>
  </div>
</template>

<script>
import config from '~/nuxt.press'

export default {
  created() {
    this.links = config.blog.links
    this.title = config.blog.title
  }
}
</script>
