import { buildFixture } from '@/utils/build'

buildFixture({ dir: __dirname, changedPaths: ['static$', 'static/rss.xml$'] })
