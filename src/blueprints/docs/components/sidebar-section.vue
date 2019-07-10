<template>
  <li :class="sectionClass">
    <section
      v-if="showChildSection"
      class="section"
    >
      <p class="sidebar-heading">
        <span>{{ name }}</span>
      </p>

      <sidebar-sections
        :active-path="activePath"
        :data="children"
        :depth="depth + 1"
        :class="{ 'sidebar-group-items': !depth, 'sidebar-sub-headers': depth }"
      />
    </section>
    <nuxt-link
      v-else
      class="sidebar-link"
      :class="{ active: url === activePath, 'sidebar-sub-header': depth }"
      :to="url">
      {{ name }}
    </nuxt-link>
  </li>
</template>

<script>
import docsMixin from '../mixin'

export default {
  components: {
    SidebarSections: () => import('./sidebar-sections')
  },
  mixins: [docsMixin],
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
  },
  computed: {
    name() {
      return this.data[1]
    },
    url() {
      return this.data[2] || '/'
    },
    children() {
      return this.data[3]
    },
    showChildSection() {
      if (this.depth < this.$page.meta.sidebarDepth) {
        return !!this.children && this.children.length > 0
      }

      return false
    },
    sectionClass() {
      return this.showChildSection ? 'sidebar-section' : 'sidebar-item'
    }
  }
}
</script>
