<template>
  <div class="docs-wrapper">
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

<style>
html, body, #__nuxt, #__layout {
  font-family: sans-serif;
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;
}
a, a:active, a:visited {
  text-decoration: none;
}
.docs-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
}
.docs-wrapper .content {
  width: calc(80% - 20px);
  padding: 20px;
  margin-bottom: 40px;
  margin-left: calc(20% + 20px);
}
</style>
