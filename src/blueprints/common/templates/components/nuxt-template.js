// @vue/component
export default {
  functional: true,
  props: {
    value: {
      type: String,
      required: true
    },
    tag: {
      type: String,
      default: 'div'
    }
  },
  render (h, { props, listeners }) {
    return h({
      mounted: () => listeners.mounted && listeners.mounted(),
      template: `<${props.tag}>${props.value}</${props.tag}>`
    })
  }
}
