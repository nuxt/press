<template>
  <article v-html="index.body" />
</template>

<script>
export default {
  layout: 'docs',
  async asyncData ({ $press, payload }) {
    const index = payload || await $press.get('api/source<%= options.docs.prefix %>topics/index')
    return { index }
  }
}
</script>
