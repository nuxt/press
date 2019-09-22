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

// @vue/component
export default {
  functional: true,
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
      required: false,
      default: ''
    }
  },
  render (h, { props, slots, parent }) {
    const data = props.data || props.source

    if (isClient) {
      requestIdleCallback(() => {
        const pressLinks = [...parent.$el.querySelectorAll('[data-press-link]')]
        for (const pressLink of pressLinks) {
          pressLink.addEventListener('click', (e) => {
            e.preventDefault()
            parent.$router.push(e.target.attributes.href.value)
            return false
          })
        }
      })
    }

    if (!isClient || data) {
      if (props.source) {
        return h('nuxt-template', {
          props: {
            tag: props.tag,
            value: props.source
          }
        })
      }

      return h(props.tag, slots().default)
    }

    // return empty tag on hydration on client
    // to prevent hydration error
    // this works because although the nuxt-template will contain
    // more html/vue components, those are not included
    // within the ssr component tree
    const vnode = h(props.tag)
    /* this should not be needed (anymore?):
    vnode.asyncFactory = {}
    vnode.isComment = true */
    return vnode
  }
}
