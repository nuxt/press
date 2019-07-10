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
  render(h, { props, children }) {
    let html
    if (children && children.length) {
      html = children.reduce((acc, c) => (acc += c.text), '')
    } else {
      html = props.value
    }

    return h({
      template: `<${props.tag}>${html}</${props.tag}>`
    })
  }
  /* created() {
    if (this.$slots.default) {
      this.html = ''
      for (const slot of this.$slots.default) {
        this.html += slot.text
      }
    } else {
      this.html = this.value
    }
    this.$watch('value', (html) => {
      this.html = html
    })
  } */
}
