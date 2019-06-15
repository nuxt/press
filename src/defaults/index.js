import docs from './docs'
import blog from './blog'
import slides from './slides'

export default {
  api: {
    // Override generic /api/source/<path> handler
    source: null
  },

  // Default config for docs mode
  docs,

  // Default config for blog mode
  blog,

  // Default config for slides mode
  slides
}
