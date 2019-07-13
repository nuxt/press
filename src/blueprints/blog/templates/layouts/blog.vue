<template>
  <div id="nuxt-press" class="blog">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import config from '~/nuxt.press'
import sidebar from 'press/blog/components/sidebar'

export default {
  components: { sidebar },
  head () {
    if (!this.$press.source) {
      return head
    } else {
      const entry = this.$press.source
      return {
        ...head,
        title: entry.title,
        meta: head.meta.concat([
          { property: 'og:title', content: entry.title },
          { property: 'og:site_name', content: config.blog.title },
          { property: 'og:type', content: 'article' },
          { property: 'og:locale', content: 'en_us' },
          { property: 'og:url', content: `${config.blog.feed.link}${entry.path}` }
        ])
      }
    }
  }
}
</script>
