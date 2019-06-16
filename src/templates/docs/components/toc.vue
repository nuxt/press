<template>
  <ul class="toc">
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
  top: 30px;
  position: fixed;
  width: calc(18%);
  border-right: 1px solid #f6f6f6;
  margin: 0px;  
  margin-right: 10px;
  padding-top: 20px;
  padding-left: 15px;
  padding-right: 15px;
  height: calc(100% - 20px);
  overflow-y: scroll;
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
  font-size: 17px;
  margin-left: 10px;
}
.h2 {
  font-size: 16px;
  margin-left: 20px;
}
.h3 {
  font-size: 15px;
  margin-left: 30px;
}

</style>
