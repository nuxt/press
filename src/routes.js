import { join, exists } from './utils'

function normalize(routes) {
  for (const route of routes) {
    if (exists(join(this.options.srcDir, route.component))) {
      route.component = `~${route.component}`
    } else {
      route.component = join(this.options.buildDir, 'press', route.component)
    }
  }
  return routes
}

export function common() {
  return normalize.call(this, [
    {
      name: 'source',
      path: '/:source(.+)',
      component: 'pages/source.vue'
    }
  ])
}

export function blog() {
  return normalize.call(this, [
    {
      name: 'blog_index',
      path: this.$press.blog.prefix,
      component: 'pages/blog/index.vue'
    },
    {
      name: 'blog_archive',
      path: `${this.$press.blog.prefix}/archive`,
      component: 'pages/blog/archive.vue'
    }
  ])
}

export function docs() {
  return normalize.call(this, [
    {
      name: 'docs_index',
      path: this.$press.docs.prefix,
      component: 'pages/docs/index.vue'
    }
  ])
}

export function slides() {
  return normalize.call(this, [
    {
      name: 'slides_index',
      path: this.$press.slides.prefix,
      component: 'pages/slides/index.vue'
    }
  ])
}
