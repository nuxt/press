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

export default {
  components,
  async asyncData ({ $press, params, payload, error }) {
    let source = payload
    if (params.source === '') {
      params.source = 'index'
    }
    if (!source) {
      source = await $press.get(`api/source/${params.source}`)
    }
    if (!source) {
      source = await $press.get(`api/source/${params.source}/index`)
    }
    if (!source) {
      return error({ statusCode: 404 })
    }
    return { source, sourcePath: params.source }
  }
}
</script>
