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
