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
      required: false
    }
  },
  render (h, { parent, props, slots }) {
    if (!props.data && props.source) {
      props.data = props.source
    }
    if (props.data || parent.$isServer) {
      if (props.source) {
        return h({
          template: `<${props.tag}>${props.source}</${props.tag}>`
        })
      } else {
        return h(props.tag, slots().default)
      }
    } else {
      const vnode = h('div', [])
      vnode.asyncFactory = {}
      vnode.isComment = true
      return vnode
    }
  }
}
