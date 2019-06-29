<template>
  <div class="sidebar">
    <div class="about">
      My NuxtPress Blog
      <div class="text-links">
        <nuxt-link 
          v-for="(link, i) in links"
          :key="`link-${i}`"
          :to="Object.values(link)[0]">
          {{ Object.keys(link)[0] }}
        </nuxt-link>
      </div>
    </div>
    <a
      v-for="(link, i) in icons"
      :href="Object.values(link)[0]">
      <img class="icon" :src="require(`../../assets/blog/icons/${Object.keys(link)[0]}.svg`)">
    </a>
  </div>
</template>

<script>
import config from '~/nuxt.press'

export default {
  data: () => ({
    links: config.blog.links,
    icons: config.blog.icons
  })
}
</script>

<style>
#nuxt-press.blog .sidebar {
  border-right: 1px solid #000;
  flex-basis: 25%;
  margin: 0px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  & .about {
    margin: 15px 0px;
    margin-bottom: 100px;
    font-size: 28px;
    display: table-caption;
    text-align: right;
    & .text-links {
      margin-top: 100px;
      & a {
        font-size: 15px;
        text-decoration: underline !important;
        display: block;
      }
    }
  }
  & a {
    display: block;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
    text-align: right;
    & img {
      display: inline-block;
      width: 30px;
      height: auto;
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
