<template>
  <component
    v-if="['entry', 'topic', 'slides'].includes(source.type)"
    :is="`press-${source.type}`"
    :data="source"
    :path="sourcePath" />
  <nuxt-template
    v-else
    v-model="source.body" />
</template>

<script>
const components = {}

<% if (options.$docs) { %>
import PressTopic from 'press/docs/components/topic'
components['press-topic'] = PressTopic
<% } %>

<% if (options.$blog) { %>
import PressEntry from 'press/blog/components/entry'
components['press-entry'] = PressEntry
<% } %>

<% if (options.$slides) { %>
import PressSlides from 'press/slides/components/slides'
components['press-slides'] = PressSlides
<% } %>

export default {
  components,
  middleware: 'press',
  layout({ $press }) {
    return $press.layout
  },
  async asyncData ({ $press, params, error }) {
    if ($press.error) {
      error($press.error)
    }
    return { source: $press.source, sourcePath: params.source }
  }
  // created() {
  //   hotReloadHook(this, async function() {
  //     const params = this.$route.params
  //     let sourceParam = params.source
  //     sourceParam = (params.source && params.source.replace(/\/+$/, '')) || 'index'
  //     let source = await this.$press.get(`api/source/${sourceParam}`)
  //     if (!source) {
  //       source = await this.$press.get(`api/source/${sourceParam}/index`)
  //     }
  //     this.$press.source = source
  //     Vue.nextTick(() => this.$forceUpdate())
  //   })
  // }
}

</script>
