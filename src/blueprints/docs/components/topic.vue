<template>
  <main class="topic">
    <nuxt-template tag="article" v-model="data.body" />
  </main>
</template>

<script>
import { startObserver } from '../../common/components/observer'

export default {
  layout: 'docs',
  props: ['data'],
  // created() {
  //   // TODO remove this once @nuxt/markdown is updated
  //   this.data.body = this.data.body.replace(/\{\{/g, '{\u200B{')
  // },
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
