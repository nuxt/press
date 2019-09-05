import { buildFixture } from 'test-utils/build'

buildFixture({ dir: __dirname, changedPaths: ['static$', 'static/rss.xml$'] })
