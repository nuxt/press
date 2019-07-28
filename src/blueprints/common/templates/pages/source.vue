<template>
  <nuxt-static
    :data="$press.source">
    <component
      v-if="['entry', 'topic', 'slides'].includes($press.source.type)"
      :is="`press-${$press.source.type}`"
      :data="$press.source"
      :path="$route.params.source" />
    <nuxt-static
      v-else
      tag="main"
      :source="$press.source.body" />
  </nuxt-static>
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

const component = Object.values(components)[0]

export default {
  components,
  middleware: 'press',
  layout: ({ $press }) => $press.layout,
  head() {
    if (component.head) {
      return {
        htmlAttrs: {
          class: this.$press.layout
        },
        ...component.head.call(this)
      }
    } else {
      return {
        htmlAttrs: {
          class: this.$press.layout
        }
      }
    }
  },
  beforeMount() {
    this.$hotUpdates = new EventSource('/__press/hot')
    this.$hotUpdates.addEventListener('message', (event) => {
      const { path } = JSON.parse(event.data)
      if (path === this.$press.source.src) {
        this.$router.go()
      }
    })
  },
  destroyed() {
    this.$hotUpdates.close()
  }
}
</script>
