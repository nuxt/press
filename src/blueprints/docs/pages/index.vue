<template>
  <article v-html="index.body" />
</template>

<script>
export default {
  layout: 'docs',
  async asyncData ({ $press, payload }) {
    const index = payload || await $press.get('api/source/docs/topics/index')
    return { index }
  }
}
</script>
