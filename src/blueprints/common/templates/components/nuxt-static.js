const isClient = process.client

let requestIdleCallback = function (cb) {
  const start = Date.now()
  return setTimeout(() => {
    cb({ // eslint-disable-line standard/no-callback-literal
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    })
  }, 1)
}

if (typeof window !== 'undefined' && window.requestIdleCallback) {
  requestIdleCallback = window.requestIdleCallback
}

export default {
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    data: {
      type: [Object, Array, Boolean],
      required: false,
      default: false
    },
    source: {
      type: String,
      required: false
    }
  },
  render (h) {
    const data = this.data || this.source

    if (isClient) {
      requestIdleCallback(() => {
        const pressLinks = [...this.$el.querySelectorAll('[data-press-link]')]
        for (const pressLink of pressLinks) {
          pressLink.addEventListener('click', this.pressLinkHandler)
        }
      })
    }
    if (data || this.$isServer) {
      if (this.source) {
        return h({
          template: `<${this.tag}>${this.source}</${this.tag}>`
        })
      } else {
        return h(this.tag, this.$slots.default)
      }
    } else {
      const vnode = h('div', [])
      vnode.asyncFactory = {}
      vnode.isComment = true
      return vnode
    }
  },
  methods: {
    pressLinkHandler (e) {
      e.preventDefault()
      this.$router.push(e.target.attributes.href.value)
      return false
    }
  }
}
