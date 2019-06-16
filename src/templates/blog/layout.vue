<template>
  <div id="nuxt-press" class="blog">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import sidebar from '../components/blog/sidebar'

export default {
  components: { sidebar }
}
</script>

<style scoped>
.blog {
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
