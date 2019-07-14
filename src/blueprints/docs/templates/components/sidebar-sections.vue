<template>
  <ul class="sidebar-links" :class="`sidebar-depth-${depth}`">
    <sidebar-section
      ref="section"
      v-for="(sectionData, i) in data"
      :key="`topic-${depth}-${i}`"
      :active-path="activePath"
      :data="sectionData"
      :depth="depth"
    />
  </ul>
</template>

<script>
import SidebarSection from 'press/docs/components/sidebar-section'

export default {
  name: 'SidebarSections',
  components: {
    SidebarSection
  },
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
    }
  }
}
</script>
