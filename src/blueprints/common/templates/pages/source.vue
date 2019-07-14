<template>
  <component
    v-if="['entry', 'topic', 'slides'].includes($press.source.type)"
    :is="`press-${$press.source.type}`"
    :data="$press.source"
    :path="$route.params.source" />
  <nuxt-static
    v-else
    tag="main"
    :source="$press.source.body" />
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
  layout: ({ $press }) => $press.layout
}
</script>
