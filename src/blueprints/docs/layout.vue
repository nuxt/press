<template>
  <div id="nuxt-press" class="docs">
    <top />

    <sidebar v-if="!$isHome || $docs.home.sidebar" />

    <nuxt
      class="content"
      :class="{ 'has-sidebar': !$isHome || $docs.home.sidebar }"
    />
  </div>
</template>

<script>
import docsMixin from './mixin'
import top from './components/header'
import sidebar from './components/sidebar'

export default {
  components: { top, sidebar },
  mixins: [docsMixin]
}
</script>
