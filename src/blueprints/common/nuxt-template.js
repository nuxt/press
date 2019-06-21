export default {
  props: {
    value: {
      type: String,
      required: true,
      default: () => ''
    }
  },
  render(h) {
    return h({
      template: `<div>${this.html}</div>`
    })
  },
  created() {
    if (this.$slots.default) {
      this.html = ''
      for (let slot of this.$slots.default) {
        this.html += slot.text
      }
    } else {
      this.html = this.value
    }
    this.$watch('value', (html) => {
      this.html = html
    })
  }
}
