<template>
  <main class="topic" v-html="data.body" />
</template>

<script>
import { startObserver } from '../../components/observer'

export default {
  props: ['data'],
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

    this._observer = startObserver({
      vm: this,
      elements,
      initialId
    },
    (target) => {
      const targetHeading = `${this.$route.path}#${target.id}`
      const heading = document.querySelector(`.toc a[href="${targetHeading}"`)
      if (heading) {
        const tocLinks = [...document.querySelectorAll('.toc a.active')]
        for (const tocLink of tocLinks) {
          tocLink.classList.remove('active')
        }
        heading.classList.add('active')

        this.$press.disableScrollBehavior = true
        this.$router.replace(targetHeading, () => {
          this.$nextTick(() => {
            this.$press.disableScrollBehavior = false
          })
        })
      }
    })
  }
}
</script>
