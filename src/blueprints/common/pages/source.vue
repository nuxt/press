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
import PressTopic from '~~/<%= options.$buildDir %>/press/docs/components/topic'
components['press-topic'] = PressTopic
<% } %>

<% if (options.$blog) { %>
import PressEntry from '~~/<%= options.$buildDir %>/press/blog/components/entry'
components['press-entry'] = PressEntry
<% } %>

<% if (options.$slides) { %>
import PressSlides from '~~/<%= options.$buildDir %>/press/slides/components/slides'
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
}
</script>
