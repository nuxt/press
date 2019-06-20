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
