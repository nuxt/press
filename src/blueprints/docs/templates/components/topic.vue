<template>
  <main>
    <home
      v-if="$isHome"
      :data="$docs.home"
      v-model="data.body"
    />
    <nuxt-template
      v-else
      tag="article"
      v-model="data.body"
    />
  </main>
</template>

<script>
import config from 'press/config'
import Home from 'press/docs/components/home'
import { startObserver } from 'press/common/components/observer'
import docsMixin from 'press/docs/mixins/docs'

export default {
  components: { Home },
  layout: 'docs',
  props: ['data'],
  mixins: [docsMixin],
  head: () => ({
    htmlAttrs: {
      class: 'docs'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: config.docs.title }
    ]
  }),
  mounted() {
    const elements = `
      .topic h1,
      .topic h2,
      .topic h3,
      .topic h4,
      .topic h5,
      .topic h6
    `

    const initialId = this.$route.hash.substr(1)

    const observedCallback = (target) => {
      const targetId = target.id ? `#${target.id}` : ``
      let targetHeading = `${this.$route.path}${targetId}`

      let heading = document.querySelector(`.sidebar a[href="${targetHeading}"`)
      if (!heading && target.tagName === 'H1') {
        targetHeading = this.$route.path
        heading = document.querySelector(`.sidebar a[href="${targetHeading}"`)
      }

      if (heading) {
        const tocLinks = [...document.querySelectorAll('.sidebar a.active')]
        for (const tocLink of tocLinks) {
          tocLink.classList.remove('active')
        }
        heading.classList.add('active')

        this.$press.disableScrollBehavior = true
        this.$router.replace(targetHeading, () => {
          this.$nextTick(() => {
            this.$press.disableScrollBehavior = false
          })
        }, () => {
          this.$press.disableScrollBehavior = false
        })
      }
    }

    this._observer = startObserver({
      vm: this,
      elements,
      initialId
    }, observedCallback)
  }
}
</script>
