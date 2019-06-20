<template>
  <no-ssr>
    <swiper ref="slides" :options="swiperOptions" :class="`slides-${path.split('/')[1]}`">
      <swiper-slide
        :key="`slide-${slideIndex}`"
        :class="`slide-${slideIndex+1}`"
        v-for="(item, slideIndex) in data.slides">
        <div v-html="item" />
      </swiper-slide>
      <div class="swiper-pagination" slot="pagination"></div>
      <div class="swiper-button-prev" slot="button-prev"></div>
      <div class="swiper-button-next" slot="button-next"></div>
    </swiper>
  </no-ssr>
</template>

<script>
let keymaster
if (process.client) {
  keymaster = require('keymaster')
}

export default {
  props: ['data', 'path'],
  data: () => ({
    swiperOptions: {
      pagination: {
        el: '.swiper-pagination',
        type: 'progressbar'
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      }
    }
  }),
  beforeMount() {
    keymaster('right', () => this.$refs.slides.swiper.slideNext())
    keymaster('left', () => this.$refs.slides.swiper.slidePrev())
  }
}
</script>
