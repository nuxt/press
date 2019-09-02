<template>
  <client-only>
    <swiper
      ref="slides"
      :options="swiperOptions"
      :class="`slides-${path.replace(/\//g, '-').replace(/-+$/, '')}`"
      @slideChange="setCurrentSlide"
    >
      <swiper-slide
        v-for="(item, slideIndex) in data.slides"
        :key="`slide-${slideIndex}`"
        class="slide"
        :class="`slide-${slideIndex+1}`"
      >
        <div v-html="item" />
      </swiper-slide>
      <div class="swiper-pagination" slot="pagination"></div>
      <div class="swiper-button-prev" slot="button-prev"></div>
      <div class="swiper-button-next" slot="button-next"></div>
    </swiper>
  </client-only>
</template>

<script>
import { startObserver } from 'press/common/components/observer'

export default {
  props: ['data', 'path'],
  data: () => ({
    currentSlide: -1,
    // http://idangero.us/swiper/api/#initialize
    swiperOptions: {
      mousewheel: true,
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
  watch: {
    currentSlide(index) {
      const currentRoute = `${this.$route.path}#${index + 1}`

      this.$press.disableScrollBehavior = true
      this.$router.replace(currentRoute, () => {
        this.$nextTick(() => {
          this.$press.disableScrollBehavior = false
        })
      })
    }
  },
  beforeMount() {
    this.swiperOptions.initialSlide = Math.max(parseInt(this.$route.hash.substr(1)) - 1 || 0, 0)

    import('keymaster').then(({ default: keymaster }) => {
      keymaster('right', () => this.$refs.slides.swiper.slideNext())
      keymaster('left', () => this.$refs.slides.swiper.slidePrev())
    })
  },
  methods: {
    setCurrentSlide() {
      this.currentSlide = this.$refs.slides && this.$refs.slides.swiper.activeIndex
    }
  }
}
</script>
