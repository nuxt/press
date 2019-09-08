<template>
  <div class="sidebar">
    <div class="about">
      <p>{{ title }}</p>

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
export default {
  created() {
    this.links = <%= JSON.stringify(options.options.links).replace(/"/g, '\'') %>
    this.title = `<%= options.options.title %>`
  }
}
</script>
