<template>
  <component
    :is="`press-${source.type}`"
    :data="source" />
</template>

<script>
const components = {}

<% if (options.$docs) { %> 
import PressTopic from './docs/topic'
components['press-topic'] = PressTopic
<% } %>

<% if (options.$blog) { %> 
import PressEntry from './blog/entry'
components['press-entry'] = PressEntry
<% } %>

<% if (options.$slides) { %> 
import PressSlides from './slides/slides'
components['press-slides'] = PressSlides
<% } %>

export default {
  components,
  layout({ params }) {
    return params.source.slice(0, params.source.indexOf('/'))
  },
  async asyncData ({ $press, params, payload }) {
    const source = payload || await $press.get(`api/source/${params.source}`)
    return { source }
  }
}
</script>
