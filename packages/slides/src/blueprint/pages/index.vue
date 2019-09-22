<template>
  <main>
    <ul>
      <li
        v-for="slides in slidesList"
        :key="slides.path"
      >
        <nuxt-link :to="slides.path">{{ slides.path }}</nuxt-link>
      </li>
    </ul>
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
