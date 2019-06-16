<template>
  <ul class="toc">
    <li
      :key="`topic-${t}`"
      v-for="(topic, t) in toc">
      <nuxt-link
        :class="{
          [`h${topic[0]}`]: true,
          active: topic[2] === `${$route.path}${$route.hash}`
        }"
        :to="topic[2]">
        {{ topic[1] }}
      </nuxt-link>
    </li>
  </ul>
</template>

<script>
import { toc } from '~/nuxt.press.json'

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
  data() {
    return {
      toc: []
    }
  },
  async mounted() {
    const index = await this.$press.get('api/docs/index')
    // TODO move to vuex for SSR prerender
    this.toc = toc.map(item => index[item]).filter(Boolean)
    this.$nextTick(() => this.watchActiveHeadings())
  },
  watch: {
    $route({ hash }) {
      const heading = document.querySelector(hash)
      if (heading) {
        heading.scrollIntoView({behavior: 'smooth'})
      }
    }
  },
  methods: {
    watchActiveHeadings() {
      const headings = [...document.querySelectorAll(`
        .topic h1,
        .topic h2,
        .topic h3,
        .topic h4,
        .topic h5,
        .topic h6
      `)]
      let ahObserver
      const observer = new IntersectionObserver((entries) => {
        if (!ahObserver) {
          ahObserver = new ActiveHeadingsObserver(entries, (target) => {
            const hash = target.querySelector('a').attributes.href.value
            for (const tocLink of [...document.querySelectorAll('.toc a')]) {
              tocLink.classList.remove('active')
            }
            const currentHeading = `${this.$route.path}${hash}`
            document.querySelector(`.toc a[href="${currentHeading}"`)
              .classList.add('active')
          })
        } else {
          ahObserver.update(entries)
        }
      })
      for (const heading of headings) {
        observer.observe(heading)
      }
    }
  }
}
</script>

<style>
.toc {
  top: 30px;
  position: fixed;
  width: calc(18%);
  border-right: 1px solid #f6f6f6;
  margin: 0px;  
  margin-right: 10px;
  padding-top: 20px;
  padding-left: 15px;
  padding-right: 15px;
  height: calc(100% - 20px);
  overflow-y: scroll;
  & li {
    list-style-type: none;
    margin: 0px;
    margin-bottom: 5px;
    padding: 0px;
    & a.active {
      font-weight: bold;
    }
  }
}
.h1 {
  font-size: 17px;
  margin-left: 10px;
}
.h2 {
  font-size: 16px;
  margin-left: 20px;
}
.h3 {
  font-size: 15px;
  margin-left: 30px;
}

</style>
