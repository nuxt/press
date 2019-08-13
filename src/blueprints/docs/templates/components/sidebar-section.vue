<template>
  <li :class="sectionClass">
    <section
      v-if="createChildSection"
      class="section">
      <p class="sidebar-heading">
        <nuxt-link
          v-if="url"
          class="sidebar-link"
          :class="{ active: isActive  }"
          :to="fullUrl">
          {{ name }}
        </nuxt-link>
        <span v-else>{{ name }}</span>
      </p>

      <component :is="components.SidebarSections"
        ref="sections"
        :active-path="activePath"
        :data="children"
        :depth="depth + 1"
        :visible="showChildSection" />
    </section>
    <nuxt-link
      v-else
      class="sidebar-link"
      :class="{ active: isActive }"
      :to="fullUrl">
      {{ name }}
    </nuxt-link>
  </li>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'

export default {
  mixins: [docsMixin],
  inject: ['components'],
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
      return this.data[2]
    },
    fullUrl() {
      return `${this.$docs.prefix}${this.url}`
    },
    children() {
      return this.data[3]
    },
    createChildSection() {
      const extraDepth = this.$page.meta.sidebar === 'auto' ? 0 : 1
      if (this.depth < this.$page.meta.sidebarDepth + extraDepth) {
        return !!this.children && this.children.length > 0
      }

      return false
    },
    showChildSection() {
      return !this.depth || this.$page.meta.sidebar === 'auto' || this.activeChildTree
    },
    isActive() {
      return this.url === this.activePath
    },
    activeChildTree() {
      if (this.isActive) {
        return true
      }

      if (!this.$refs.sections) {
        return false
      }

      // or maybe better with an up-bubbling event?
      const sections = this.$refs.sections.$refs.section
      if (Array.isArray(sections)) {
        for (const section of sections) {
          if (section.isActive) {
            return true
          }
        }
      }

      return false
    },
    sectionClass() {
      return this.createChildSection ? 'sidebar-section' : 'sidebar-item'
    }
  }
}
</script>
