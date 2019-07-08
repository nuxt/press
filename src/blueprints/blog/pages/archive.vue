<template>
  <main>
    <template v-for="year in Object.keys(archive).reverse()">
      <h1>{{ year }}</h1>
      <template v-for="month in Object.keys(archive[year]).reverse()">
        <template v-for="entry in archive[year][month]">
          <p class="title"><a :href="`/${entry.permalink}`">{{ entry.title }}</a></p>
        </template>
      </template>
    </template>
  </main>
</template>

<script>
export default {
  layout: 'blog',
  async asyncData ({ $press, payload }) {
    const archive = payload || await $press.get('api/blog/archive')
    return { archive }
  }
}
</script>
