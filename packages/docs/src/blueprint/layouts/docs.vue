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
  head() {
    // TODO:
    // Try to better understand why setting this in components/topic.vue
    // (often) triggers a 'flash' while switching page/locale
    // due to momentarily having all the head info being removed
    //
    // Its probably often and not always because vue-meta tries to group
    // fast-occuring metaInfo updates which sometimes succeeeds in combining
    // two update triggers and sometimes not
    //
    // Setting keep-alive: true on <nuxt/> seems to improve this slightly, but
    // sometimes the source.vue component still gets re-created and that still
    // triggers the flash
    //
    // To trigger the flash:
    // - remove keep-alive prop from <nuxt/> and set htmmlAttrs in topic.vue
    //
    // To fix? the flash
    // - return htmlAttrs from layout instead of topic
    //
    return {
      htmlAttrs: {
        class: 'docs'
      }
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
      if (!this.$docs) {
        return false
      }
      return !this.$isHome || this.$docs.home.header
    },
    getHasSidebar() {
      if (!this.$docs) {
        return false
      }
      return !this.$isHome || this.$docs.home.sidebar
    }
  }
}
</script>
