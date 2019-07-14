<template>
  <li :class="sectionClass">
    <section
      v-if="createChildSection"
      class="section"
    >
      <p class="sidebar-heading">
        <nuxt-link
          v-if="url"
          class="sidebar-link"
          :class="{ active: isActive  }"
          :to="url"
        >
          {{ name }}
        </nuxt-link>
        <span v-else>{{ name }}</span>
      </p>

      <sidebar-sections
        ref="sections"
        :active-path="activePath"
        :data="children"
        :depth="depth + 1"
        :hidden="!showChildSection"
        v-show="showChildSection"
      />
    </section>
    <nuxt-link
      v-else
      class="sidebar-link"
      :class="{ active: isActive }"
      :to="url">
      {{ name }}
    </nuxt-link>
  </li>
</template>

<script>
import docsMixin from 'press/docs/mixins/docs'

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
      return this.data[2]
    },
    path() {
      const index = this.url.indexOf('#')
      return index === -1 ? this.url : this.url.substr(0, index)
    },
    children() {
      return this.data[3]
    },
    createChildSection() {
      if (this.depth <= this.$page.meta.sidebarDepth) {
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
