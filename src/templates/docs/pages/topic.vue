<template>
  <main class="topic" v-html="data.body" />
</template>

<script>
class ActiveHeadingsObserver {
  static getEntryId(entry) {
    return `${entry.target.tagName}${entry.target.id}`
  }
  constructor(entries, route, activeCallback) {
    this.route = route
    this.activeCallback = activeCallback
    this.entries = []
    this.update(entries, true)
  }
  update(entries, initial) {
    for (const entry of entries) {
      entry.$id = ActiveHeadingsObserver.getEntryId(entry)
      if (initial) {
        this.entries.push(entry)
        continue
      }
      const oldEntryIndex = this.entries.findIndex(e => e.$id === entry.$id)
      this.entries.splice(oldEntryIndex, 1, entry)
    }
    this.emitActive(initial)
  }
  emitActive(initial) {
    if (initial) {
      const initialHash = this.route.hash.substr(1)
      const entry = this.entries.find(e => e.target.id === initialHash)
      if (entry) {
        this.activeCallback(entry.target)
      }
      return
    }

    const [entry] = this.entries.filter(e => e.intersectionRatio > 0)
    if (entry) {
      this.activeCallback(entry.target)
    }
  }
}

export default {
  props: ['data'],
  data: () => ({
    _observer: null,
    _timeout: null,
    headings: []
  }),
  /* activated() {
    this.observeActiveHeaders()
  },
  deactivated() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }, */
  mounted() {
    this.observeActiveHeaders()
  },
  destroyed() {
    if (this._observer) {
      this._observer.disconnect()
    }
  },
  methods: {
    observeActiveHeaders() {
      let ahObserver
      this._observer = new IntersectionObserver((entries) => {
        if (!ahObserver) {
          ahObserver = new ActiveHeadingsObserver(entries, this.$route, (target) => {
            clearTimeout(this._timeout)

            this._timeout = setTimeout(() => {
              const targetHeading = `${this.$route.path}#${target.id}`
              const heading = document.querySelector(`.toc a[href="${targetHeading}"`)
              if (heading) {
                const tocLinks = [...document.querySelectorAll('.toc a.active')]
                heading.classList.add('active')

                for (const tocLink of tocLinks.filter(tl => !tl.isEqualNode(heading))) {
                  tocLink.classList.remove('active')
                }

                this.$press.disableScrollBehavior = true
                this.$router.replace(targetHeading, () => {
                  this.$nextTick(() => {
                    this.$press.disableScrollBehavior = false
                  })
                })
              }
            }, 100)
          })
        } else {
          ahObserver.update(entries)
        }
      })
      if (this.headings.length) {
        for (const heading of this.headings) {
          this._observer.unobserve(heading)
        }
      }
      this.headings = [...document.querySelectorAll(`
        .topic h1,
        .topic h2,
        .topic h3,
        .topic h4,
        .topic h5,
        .topic h6
      `)]
      for (const heading of this.headings) {
        this._observer.observe(heading)
      }
    }
  }
}
</script>
