<template>
  <div class="sidebar">
    <div class="about">
      My NuxtPress Blog
      <div class="text-links">
        <nuxt-link 
          v-for="(link, i) in links"
          :key="`link-${i}`"
          :to="Object.values(link)[0]">
          {{ Object.keys(link)[0] }}
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
import config from '~/nuxt.press'

export default {
  data: () => ({
    links: config.blog.links
  })
}
</script>
