<template>
  <div id="nuxt-press" class="docs">
    <top />

    <sidebar v-if="!$isHome" />

    <nuxt
      class="content"
      :class="{ 'has-sidebar': !$isHome }"
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
