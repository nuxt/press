import Vue from 'vue'
import { trimSlash } from './utils'

export default function docsPlugin(ctx, inject) {

  const pages = JSON.parse(`<%=JSON.stringify(options.docs.$pages, null, 2).replace(/`/g, '\\`')%>`)

  const docs = {
    pages
  }

  ctx.$docs = docs
  inject('docs', docs)
}
