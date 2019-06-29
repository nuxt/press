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
import PressTopic from '../../docs/components/source'
components['press-topic'] = PressTopic
<% } %>

<% if (options.$blog) { %>
import PressEntry from '../../blog/components/source'
components['press-entry'] = PressEntry
<% } %>

<% if (options.$slides) { %>
import PressSlides from '../../slides/components/source'
components['press-slides'] = PressSlides
<% } %>

export default {
  components,
  middleware: 'press',
  layout({ $press }) {
    console.log('$press.layout', $press.layout)
    return $press.layout
  },
  async asyncData ({ $press, params, error }) {
    if ($press.error) {
      error($press.error)
    }
    console.log('$press.source', $press.source)
    return { source: $press.source, sourcePath: params.source }
  }
}
</script>
