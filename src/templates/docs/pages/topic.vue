<template>
  <main class="topic" v-html="data.body" />
</template>

<script>
class ActiveHeadingsObserver {
  static getEntryId(entry) {
    return `${entry.target.tagName}${entry.target.id}`
  }
  constructor(entries, activeCallback) {
    this.entryHash = {}
    this.activeCallback = activeCallback
    this.entries = []
    for (const entry of entries) {
      entry.$id = ActiveHeadingsObserver.getEntryId(entry)
      this.entries.push(entry)
    }
    this.emitActive()
  }
  update(entries) {
    for (const entry of entries) {
      const entryId = ActiveHeadingsObserver.getEntryId(entry)
      const oldEntryIndex = this.entries.findIndex(e => e.$id === entryId)
      entry.$id = entryId
      this.entries.splice(oldEntryIndex, 1, entry)
    }
    this.emitActive()
  }
  emitActive() {
    for (const entry of this.entries) {
      if (entry.intersectionRatio > 0) {
        this.activeCallback(entry.target)
        break
      }
    }
  }
}

export default {
  props: ['data'],
  data: () => ({
    observer: null,
    headings: []
  }),
  mounted() {
    this.observeActiveHeaders()
  },
  watch: {
    $route() {
      this.$nextTick(() => this.observeActiveHeaders())
    }
  },
  methods: {
    observeActiveHeaders() {
      let ahObserver      
      this.observer = new IntersectionObserver((entries) => {
        if (!ahObserver) {
          ahObserver = new ActiveHeadingsObserver(entries, (target) => {
            const hash = target.querySelector('a').attributes.href.value
            for (const tocLink of [...document.querySelectorAll('.toc a')]) {
              tocLink.classList.remove('active')
            }
            const currentHeading = `${this.$route.path}${hash}`
            let heading = document.querySelector(`.toc a[href="${currentHeading}"`)
            if (heading) {
              heading.classList.add('active')
            }
          })
        } else {
          ahObserver.update(entries)
        }
      })
      if (this.headings.length) {
        for (const heading of this.headings) {
          this.observer.unobserve(heading)
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
        this.observer.observe(heading)
      }
    }
  }
}
</script>
