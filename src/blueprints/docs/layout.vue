<template>
  <div id="nuxt-press" class="docs">
    <top />
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import top from './components/header'
import sidebar from './components/sidebar'

export default {
  components: { top, sidebar }
}
</script>
