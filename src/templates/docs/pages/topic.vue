<template>
  <main class="topic" v-html="data.body" />
</template>

<script>

export default {
  props: ['data']
}
</script>
