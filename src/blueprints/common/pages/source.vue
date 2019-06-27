<template>
  <component
    v-if="source.type !== 'page'"
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
import PressTopic from '../../docs/pages/topic'
components['press-topic'] = PressTopic
<% } %>

<% if (options.$blog) { %> 
import PressEntry from '../../blog/pages/entry'
components['press-entry'] = PressEntry
<% } %>

<% if (options.$slides) { %> 
import PressSlides from '../../slides/pages/slides'
components['press-slides'] = PressSlides
<% } %>

const layoutTypeMap = {
  'press-topic': 'docs',
  'press-entry': 'blog',
  'press-slides': 'slides'
}

const layoutTypeMapValues = Object.values(layoutTypeMap)

export default {
  components,
  middleware: 'press',
  layout({ params }) {
    const cKeys = Object.keys(components)
    if (cKeys.length === 1) { // single-mode
      return layoutTypeMap[cKeys[0]]
    } else {
      const layout = params.source.slice(0, params.source.indexOf('/'))
      if (layoutTypeMapValues.includes(layout)) {
        console.log('layout: ', layout)
        return layout
      } else {
        console.log('layout: default')
        return 'default'
      }
    }
  },
  async asyncData ({ $press, params, payload }) {
    console.log('$press.sources', $press.sources)
    console.log('params.source', params.source)
    const source = payload || await $press.get(`api/source/${params.source}`)
    console.log('source', source)
    return { source, sourcePath: params.source }
  }
}
</script>
