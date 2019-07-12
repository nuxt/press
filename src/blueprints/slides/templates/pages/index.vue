<template>
  <main>
    <template v-for="slides in slidesList">
      <p class="title">
        <nuxt-link :to="slides.path">{{ slides.path }}</nuxt-link>
      </p>
    </template>
  </main>
</template>

<script>
export default {
  async asyncData ({ $press, payload }) {
    const slidesList = payload || await $press.get('api/slides/index')

    return { slidesList }
  }
}
</script>
