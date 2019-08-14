<template>
  <component
    v-if="componentType"
    :is="componentType"
    :data="$press.source"
    :path="$route.params.source" />
  <nuxt-static
    v-else
    tag="main"
    :source="$press.source.body" />
</template>

<script>
<%= options.$docs ? `import PressTopic from 'press/docs/components/topic'` : '' %>
<%= options.$blog ? `import PressEntry from 'press/blog/components/entry'` : '' %>
<%= options.$slides ? `import PressSlides from 'press/slides/components/slides'` : '' %>

export default {
  components: {
<%
const components = []
if (options.$docs) components.push('PressTopic')
if (options.$blog) components.push('PressEntry')
if (options.$slides) components.push('PressSlides')
%>
    <%= components.join(',\n    ') %>
  },
  middleware: 'press',
  layout: ({ $press }) => $press.layout,
  head() {
    const componentHasHead = !!<%= components[0] %>.head

    if (componentHasHead) {
      return {}
    }

    return {
      htmlAttrs: {
        class: this.$press.layout
      }
    }
  },
  validate({ $press }) {
    // middleware's run before validate
    return !!$press.source
  },
  computed: {
    sourceType() {
      return this.$press.source.type
    },
    componentType() {
<%
const componentTypes = []
if (options.$docs) componentTypes.push('topic')
if (options.$blog) componentTypes.push('entry')
if (options.$slides) componentTypes.push('slides')
%>
      if (['<%= componentTypes.join(`', '`) %>'].includes(this.sourceType)) {
        return `press-${this.sourceType}`
      }

      return ''
    }
  },
<% if (options.dev) { %>
  beforeMount() {
    this.$hotUpdates = new EventSource('/__press/hot')
    this.$hotUpdates.addEventListener('message', (event) => {
      const source = JSON.parse(event.data)
      if (!source || !source.src) {
        return
      }
      if (source.src === this.$press.source.src) {
        if (source.event === 'unlink') {
          window.location.reload() // Fresh 404
        } else {
          this.$press.source = source
          this.$nextTick(() => this.$forceUpdate())
        }
      }
    })
  },
  destroyed() {
    this.$hotUpdates.close()
  }
<% } %>
}
</script>
