export default function docsPlugin(ctx, inject) {
  const pages = JSON.parse(`<%=options.docs.$pagesJSON%>`)

  let home = null
  const homePage = pages['/']
  if (homePage && homePage.meta && homePage.meta.home) {
    home = homePage.meta
  }

  const docs = {
    home,
    pages
  }

  ctx.$docs = docs
  inject('docs', docs)
}
