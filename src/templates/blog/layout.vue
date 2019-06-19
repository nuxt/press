<template>
  <div id="nuxt-press" class="blog">
    <sidebar />
    <nuxt class="content" />
  </div>
</template>

<script>
import sidebar from '../components/blog/sidebar'

export default {
  components: { sidebar }
}
</script>

<style>
.blog {
  width: 740px !important;
  display: flex;
  flex-grow: 1;
  justify-content: center;
  & .content {
    background: linear-gradient(90deg, rgba(244,244,244,1.0) 50%, rgba(255,255,255,1.0) 95%, rgba(255,255,255,1.0) 100%);
    flex-basis: 75%;
    padding: 20px;
    & h3 {
      user-select: none;
      & span {
        color: #2f495e !important;
        text-shadow: 1px 1px #fff;
        margin-bottom: 0px;
        border-bottom: 2px solid #2f495e;
      }
      &:not(:first-of-type) {
        margin-top: 50px;
      }
    }
    & pre,
    & pre[class*="language-"] {
      background: #fff !important;
    }
  }
}
</style>
