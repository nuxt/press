// @vue/component
export default {
  name: 'PressLink',
  functional: true,
  props: {
    to: {
      type: String,
      default: ''
    }
  },
  render (h, { props, slots }) {
    const attrs = {
      'href': props.to,
      'data-press-link': 'true'
    }
    return h('a', { attrs }, slots().default)
  }
}
