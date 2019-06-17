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
  width: 740px !important;
  display: flex;
  flex-grow: 1;
  justify-content: center;
  & .content {
    background: linear-gradient(90deg, rgba(244,244,244,1.0) 50%, rgba(255,255,255,1.0) 95%, rgba(255,255,255,1.0) 100%);
    flex-basis: 75%;
    padding: 20px;
  }
}
</style>
