import loadDocs from './docs'
import loadBlog from './blog'
import loadSlides from './slides'

export default async function loadData() {
  const data = {}
  if (this.$press.$docs) {
    await loadDocs.call(this, data)
  }
  if (this.$press.$blog) {
    await loadBlog.call(this, data)
  }
  if (this.$press.$slides) {
    await loadSlides.call(this, data)
  }
  return data
}
