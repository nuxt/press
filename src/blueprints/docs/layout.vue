<template>
  <div id="nuxt-press" class="docs">
    <top />

    <main>
      <toc />

      <nuxt class="content" />
    </main>
  </div>
</template>

<script>
import top from './components/header'
import toc from './components/toc'

export default {
  components: { top, toc }
}
</script>
