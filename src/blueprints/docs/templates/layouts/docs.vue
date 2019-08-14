<template>
  <div id="nuxt-press" class="docs">
    <top v-if="hasHeader" />
    <sidebar v-if="hasSidebar" :initial="initialLoad" />
    <nuxt
      class="content wysiwyg"
      :class="{ 'has-sidebar': hasSidebar }"
    />
  </div>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'
import top from 'press/docs/components/header'
import sidebar from 'press/docs/components/sidebar'

export default {
  components: { top, sidebar },
  mixins: [docsMixin],
  data() {
    return {
      initialLoad: true
    }
  },
  computed: {
    hasHeader() {
      return !this.$isHome || this.$docs.home.header
    },
    hasSidebar() {
      return !this.$isHome || this.$docs.home.sidebar
    }
  },
  mounted() {
    this.$nextTick(() => (this.initialLoad = false))
  }
}
</script>
