// let compiler
// if (process.client) {
//   compiler = require('vue-template-compiler/browser.js')
// } else {
//   compiler = require('vue-template-compiler')
// }

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
  // render(h) {
  //   let render = compiler
  //     .compile(`<div>${this.html}</div>`).render
  //   render = render.replace('with (this')
  //   return h({
  //     render: eval(`(function() { ${
  //       
  //     } })`)()
  //   })
  // },
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
