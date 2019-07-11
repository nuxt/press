export default function docsPlugin(ctx, inject) {
  const pages = JSON.parse(`<%=options.docs.$pages%>`)

  const docs = {
    pages
  }

  ctx.$docs = docs
  inject('docs', docs)
}
