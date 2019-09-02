<template>
  <main>
    <home
      v-if="isHome"
      :data="$docs.home"
      :value="data.body"
      :meta="meta"
    />
    <nuxt-template
      v-else
      tag="article"
      :value="data.body"
    />
  </main>
</template>

<script>
import { startObserver } from 'press/core/components/observer'
import Home from 'press/docs/components/home'
import docsMixin from 'press/docs/mixins/docs'

export default {
  components: { Home },
  props: ['data', 'path'],
  mixins: [docsMixin],
  head() {
    const meta = [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: this.$docs.title }
    ]

    if (this.$docs.image) {
      meta.push({ property: 'og:image', content: this.$docs.image })
    }

    if (this.$description) {
      meta.push({ name: "description", content: this.meta.description })
    }

    return {
      meta,
      title: this.meta.title,
      titleTemplate: `%s - ${this.$docs.title}`
    }
  },
  computed: {
    meta() {
      return {
        title: this.$page.title || 'Hello',
        description: this.$page.description || 'Welcome to your NuxtPress site'
      }
    }
  },
  created() {
    // make isHome non-reactive
    // otherwise on route change (triggered by the header observer)
    // $isHome triggers a re-render of nuxt-template
    // although visibly nothing happens it just shouldnt happen
    // and it alos breaks the observer
    this.isHome = this.$isHome
  },
  updated() {
    // no need to add observer for Home component
    if (this.isHome) {
      return
    }

    this.restartObserver()
  },
  mounted() {
    // no need to add observer for Home component
    if (this.isHome) {
      return
    }

    this.startObserver()
  },
  methods: {
    restartObserver() {
      this.stopObserver()
      this.startObserver()
    },
    stopObserver() {
      if (!this._observer) {
        this._observer.disconnect()
        this._observer = undefined
      }
    },
    startObserver() {
      const elements = `
        article h1,
        article h2,
        article h3,
        article h4,
        article h5,
        article h6
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
        initialId,
        options: {  }
      }, observedCallback)
    }
  }
}
</script>
