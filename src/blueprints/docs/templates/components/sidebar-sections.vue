<template functional>
  <ul class="sidebar-links" :class="`sidebar-depth-${props.depth}`">
    <component :is="injections.components.SidebarSection"
      ref="section"
      v-for="(sectionData, i) in props.data"
      :key="`topic-${props.depth}-${i}`"
      :active-path="props.activePath"
      :data="sectionData"
      :depth="props.depth"
    />
  </ul>
</template>

<script>
export default {
  name: 'SidebarSections',
  props: {
    activePath: {
      type: String
    },
    data: {
      type: Array,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
  },
  inject: ['components']
}
</script>
