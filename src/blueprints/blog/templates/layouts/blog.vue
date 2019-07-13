<template>
  <div id="nuxt-press" class="blog">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import head from 'press/blog/head'
import sidebar from 'press/blog/components/sidebar'
import config from '~/nuxt.press'

export default {
  components: { sidebar },
  head () {
    if (!this.$press.source) {
      return head
    } else {
      const entry = this.$press.source
      const meta = [
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: `${config.blog.feed.link}${entry.path}` },
        { property: 'og:title', content: entry.title },
        { property: 'og:site_name', content: config.blog.title },
      ]
      if (entry.description) {
        meta.push(
          { property: 'og:description', content: entry.description }
        )
      }
      return {
        ...head,
        title: entry.title,
        meta: head.meta.concat(meta)
      }
    }
  }
}
</script>
