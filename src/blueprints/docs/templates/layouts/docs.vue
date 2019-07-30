<template>
  <div id="nuxt-press" class="docs">
    <top />
    <sidebar v-if="!$isHome || $docs.home.sidebar" />
    <nuxt
      class="content wysiwyg"
      :class="{ 'has-sidebar': !$isHome || $docs.home.sidebar }"
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
  head() {
    const meta = []

    if (this.$description) {
      meta.push({ name: "description", content: this.$description })
    }

    return {
      title: this.$title,
      titleTemplate: `%s - ${this.$press.docs.title}`,
      meta,
    }
  }
}
</script>
