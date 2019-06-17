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
  height: 100%;
  width: 740px !important;
  display: flex;
  justify-content: center;
  & .content {
    /*background: #f6f6f6;*/
    background: linear-gradient(90deg, rgba(244,244,244,1.0) 50%, rgba(255,255,255,1.0) 95%, rgba(255,255,255,1.0) 100%);
    flex-basis: 75%;
    padding: 20px;
  }
}
</style>
