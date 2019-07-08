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
    <a
      v-for="(link, i) in icons"
      :href="Object.values(link)[0]">
      <img class="icon" :src="require(`../../assets/blog/icons/${Object.keys(link)[0]}.svg`)">
    </a>
  </div>
</template>

<script>
import config from '~/nuxt.press'

export default {
  data: () => ({
    links: config.blog.links,
    icons: config.blog.icons
  })
}
</script>
