<template functional>
  <ul
    v-show="props.visible"
    :hidden="!props.visible"
    class="sidebar-links"
    :class="`sidebar-depth-${props.depth}`"
  >
    <component :is="injections.components.SidebarSection"
      ref="section"
      v-for="(sectionData, i) in props.data"
      @active="(...args) => (listeners.active && listeners.active(...args))"
      :key="`topic-${props.depth}-${i}`"
      :active-path="props.activePath"
      :active-page="props.activePage"
      :data="sectionData"
      :depth="props.depth"
    />
  </ul>
</template>

<script>
export default {
  name: 'SidebarSections',
  inject: ['components'],
  props: {
    activePath: {
      type: String
    },
    activePage: {
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
    visible: {
      type: Boolean,
      default: true
    }
  }
}
</script>
