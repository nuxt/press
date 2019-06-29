<template>
  <main>
    <article v-html="index.body"/>
  </main>
</template>

<script>
export default {
  layout: 'docs',
  async asyncData ({ $press, payload }) {
    const index = payload || await $press.get('api/source<%= options.docs.prefix || '/' %>index')
    return { index }
  }
}
</script>
