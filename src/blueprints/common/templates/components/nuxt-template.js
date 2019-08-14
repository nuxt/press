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
  render (h, { props }) {
    return h({
      template: `<${props.tag}>${props.value}</${props.tag}>`
    })
  }
}
