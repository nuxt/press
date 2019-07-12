<template>
  <div id="nuxt-press" class="blog">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import sidebar from 'press/blog/components/sidebar'

export default {
  components: { sidebar }
}
</script>
