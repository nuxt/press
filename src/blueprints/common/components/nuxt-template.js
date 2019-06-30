export default {
  props: {
    value: {
      type: String,
      required: true,
      default: () => ''
    },
    tag: {
      type: String,
      default: () => 'div'
    }
  },
  render(h) {
    return h({
      template: `<${this.tag}>${this.html}</${this.tag}>`
    })
  },
  created() {
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
  }
}
