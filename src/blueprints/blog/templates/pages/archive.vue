<template>
  <nuxt-static tag="main" :data="$press.data.archive">
    <div v-for="year in Object.keys(this.$press.data.archive || {}).reverse()">
      <h1>{{ year }}</h1>
      <template v-for="month in Object.keys($press.data.archive[year]).sort().reverse()">
        <template v-for="entry in $press.data.archive[year][month]">
          <p class="title"><press-link :to="entry.path">{{ entry.title }}</press-link></p>
        </template>
      </template>
    </div>
  </nuxt-static>
</template>

<script>
export default {
  layout: 'blog',
  async fetch ({ $press, payload }) {
    $press.data.archive = payload || await $press.get('api/blog/archive')
  }
}
</script>
