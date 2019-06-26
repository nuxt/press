<template>
  <component
    :is="`press-${source.type}`"
    :data="source"
    :path="sourcePath" />
</template>

<script>
const components = {}

// The component key differs from the actual component name
// because the key is also used to determine the layout

<% if (options.$docs) { %> 
import PressTopic from '../../docs/pages/topic'
components['press-docs'] = PressTopic
<% } %>

<% if (options.$blog) { %> 
import PressEntry from '../../blog/pages/entry'
components['press-blog'] = PressEntry
<% } %>

<% if (options.$slides) { %> 
import PressSlides from '../../slides/pages/slides'
components['press-slides'] = PressSlides
<% } %>

export default {
  components,
  layout({ params }) {
    const cKeys = Object.keys(components)
    if (cKeys.length === 1) { // single-mode
      return cKeys[0].slice(cKeys[0].indexOf('-') + 1)
    } else {
      return params.source.slice(0, params.source.indexOf('/'))
    }
  },
  async asyncData ({ $press, params, payload }) {
    const source = payload || await $press.get(`api/source/${params.source}`)
    return { source, sourcePath: params.source }
  }
}
</script>
