<template>
  <ul class="sidebar-links">
    <sidebar-section
      v-for="(sectionData, i) in data"
      :key="`topic-${depth}-${i}`"
      :active-path="activePath"
      :data="sectionData"
      :depth="depth"
    />
  </ul>
</template>

<script>
import SidebarSection from './sidebar-section'

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
