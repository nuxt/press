<template>
  <nav class="toc">
    <ul>
      <li
        :key="`topic-${t}`"
        v-for="(topic, t) in toc">
        <nuxt-link
          :class="{
            [`h${topic[0]}`]: true,
            active: topic[2] === `${$route.path}${$route.hash}`
          }"
          :to="topic[2]">
          {{ topic[1] }}
        </nuxt-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import { toc } from '~/nuxt.press.json'

export default {
  data() {
    return {
      toc: []
    }
  },
  async mounted() {
    const index = await this.$press.get('api/docs/index')
    // TODO move to vuex for SSR prerender
    this.toc = toc.map(item => index[item]).filter(Boolean)
  },
  watch: {
    async $route({ hash }) {
      const heading = document.querySelector(hash)
      if (heading) {
        heading.scrollIntoView({behavior: 'smooth'})
      }
    }
  }
}
</script>

<style>
.toc {
  width: 18vw;
  border-right: 1px solid #f6f6f6;
  margin: 0;
  padding: 1.4em 1.1em 0 1.1em;
  overflow-y: auto;

  & li {
    list-style-type: none;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
    & a.active {
      font-weight: bold;
    }
  }
}

.h1 {
  font-size: 1.3em;
  margin-left: .7em;
}

.h2 {
  font-size: 1.2em;
  margin-left: 1.4em;
}

.h3 {
  font-size: 1.1em;
  margin-left: 2.1em;
}

</style>
