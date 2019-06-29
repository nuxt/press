<template>
  <main>
    <article v-html="index.body"/>
  </main>
</template>

<script>
export default {
  layout: 'docs',
  async asyncData ({ $press, payload, error }) {
    const index = payload || await $press.get('api/source<%= options.docs.prefix || '/' %>index')
    if (!index) {
      return error({ statusCode: 404 })
    }
    return { index }
  }
}
</script>
