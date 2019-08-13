<template>
  <main>
    <home
      v-if="isHome"
      :data="$docs.home"
      :value="data.body"
      :meta="meta"
      @mounted="templateReady"
    />
    <nuxt-template
      v-else
      tag="article"
      :value="data.body"
      @mounted="templateReady"
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
  props: ['data', 'path'],
  mixins: [docsMixin],
  transition: () => this.isHome ? '' : 'page',
  head() {
    const meta = [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: this.$press.docs.title }
    ]

    if (this.$description) {
      meta.push({ name: "description", content: this.$description })
    }

    return {
      htmlAttrs: {
        class: 'docs'
      },
      meta,
      title: this.$title,
      titleTemplate: `%s - ${this.$press.docs.title}`
    }
  },
  computed: {
    $title () {
      return this.$page.meta.title || (this.$page.toc[0] && this.$page.toc[0][1]) || 'Hello'
    },
    $description () {
      return this.$page.meta.description || 'Welcome to your NuxtPress site'
    },
    meta() {
      return {
        title: this.$title,
        description: this.$description
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
    templateReady() {
      this.$nuxt.$emit('topicReady')
    },
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
