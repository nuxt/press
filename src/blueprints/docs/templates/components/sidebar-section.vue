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
        :active-path="activePath"
        :active-page="activePage"
        :data="children"
        :depth="depth + 1"
        :visible="showChildSection"
        @active="setChildActive"
      />
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
    }
  },
  created() {
    if (this.isActive) {
      this.$emit('active', this.isActive, this.name)
    }
  },
  data() {
    return {
      activeChilds: 0
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
    isActive() {
      let isActive = this.url === this.activePath

      if (!isActive) {
        isActive = this.url === this.activePage
      }

      return isActive
    },
    anyActive() {
      return this.isActive || this.activeChilds > 0
    },
    createChildSection() {
      const extraDepth = this.$page.meta.sidebar === 'auto' ? 0 : 1
      if (this.depth < this.$page.meta.sidebarDepth + extraDepth) {
        return !!this.children && this.children.length > 0
      }

      return false
    },
    showChildSection() {
      return !this.depth || this.$page.meta.sidebar === 'auto' || this.anyActive
    },
    sectionClass() {
      return this.createChildSection ? 'sidebar-section' : 'sidebar-item'
    }
  },
  watch: {
    isActive(value) {
      this.$emit('active', value, this.name)
    }
  },
  methods: {
    setChildActive(hasActiveChild, name) {
      this.activeChilds += hasActiveChild ? 1 : -1
    }
  }
}
</script>
