<template>
  <div id="nuxt-press" class="docs">
    <toc />
    <nuxt class="content" />
  </div>
</template>

<script>
import toc from '../components/docs/toc'

export default {
  components: { toc }
}
</script>

<style scoped>
.docs {
  width: 100%;
  height: 100%;
  & .content {
    width: calc(60% - 40px);
    padding: 20px;
    margin-bottom: 40px;
    margin-left: calc(30%);
  }
}
</style>
