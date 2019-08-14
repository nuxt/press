<template>
  <div id="nuxt-press" class="docs">
    <top v-if="hasHeader" />
    <sidebar v-if="hasSidebar" />
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
      hasHeader: false,
      hasSidebar: false
    }
  },
  created() {
    this.hasHeader = this.getHasHeader()
    this.hasSidebar = this.getHasSidebar()

    // wait until the source page component has been fully mounted
    // before updating the sidebars
    this.$nuxt.$on('press:sourceReady', this.sourceReady)
  },
  destroyed() {
    this.$nuxt.$off('press:sourceReady', this.sourceReady)
  },
  methods: {
    sourceReady() {
      this.hasHeader = this.getHasHeader()
      this.hasSidebar = this.getHasSidebar()
    },
    getHasHeader() {
      return !this.$isHome || this.$docs.home.header
    },
    getHasSidebar() {
      return !this.$isHome || this.$docs.home.sidebar
    }
  }
}
</script>
