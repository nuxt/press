<template>
  <div id="nuxt-press" class="blog wysiwyg">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import Sidebar from 'press/blog/components/sidebar'
import head from 'press/blog/layouts/head'

export default {
  components: { Sidebar },
  head () {
    if (!this.$press.source) {
      return head
    }

    const entry = this.$press.source
    const meta = [
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `<%= options.options.feed.link %>${entry.path}` },
      { property: 'og:title', content: entry.title }
    ]
    if (entry.meta) {
      meta.push(...meta)
    }
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
</script>
