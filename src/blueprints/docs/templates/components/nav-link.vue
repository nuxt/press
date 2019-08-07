<template>
  <nuxt-link
    class="nav-link"
    v-if="!isExternal(link)"
    :to="localisedLink"
    :exact="exact"
  >{{ item.text }}</nuxt-link>
  <a
    v-else
    :href="link"
    class="nav-link external"
    :target="isMailto(link) || isTel(link) ? null : '_blank'"
    :rel="isMailto(link) || isTel(link) ? null : 'noopener noreferrer'"
  >
    {{ item.text }}
    <OutboundLink/>
  </a>
</template>

<script>
import { isExternal, isMailto, isTel } from 'press/docs/utils'

export default {
  props: {
    item: {
      required: true
    }
  },
  computed: {
    localisedLink() {
      return `${this.$press.docs.prefix}${this.$press.locale ? '/' : ''}${this.$press.locale}${this.link}`
    },
    link() {
      return this.item.link
    },
    exact () {
      return this.link === '/'
    }
  },
  methods: {
    isExternal,
    isMailto,
    isTel
  }
}
</script>
