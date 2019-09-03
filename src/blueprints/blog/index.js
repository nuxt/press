import chokidar from 'chokidar'
import Markdown from '@nuxt/markdown'
import graymatter from 'gray-matter'
import {
  importModule,
  join,
  slugify,
  updateConfig,
  readJsonSync,
  routePath,
  trimSlash,
  isBlueprintEnabled
} from '../../utils'

import data, { parseEntry } from './data'

const defaultPrefix = '/blog/'
const defaultDir = ['entries', 'post']

export default {
  // Include data loader
  data,
  // Enable blog if srcDir/blog/ exists
  enabled (context) {
    return isBlueprintEnabled.call(this, context, {
      id: 'blog',
      defaultDir,
      defaultPrefix
    })
  },
  templates: {
    'archive': 'pages/archive.vue',
    'entry': 'components/entry.vue',
    'index': 'pages/index.vue',
    'layout': 'layouts/blog.vue',
    'sidebar': 'components/sidebar.vue',
    'head': 'head.js',
    'feed': 'static/rss.xml'
  },
  routes ({ options }, templates) {
    return [
      {
        name: 'blog-index',
        path: options.prefix,
        component: templates.index
      },
      {
        name: 'blog-archive',
        path: `${options.prefix}archive`,
        component: templates.archive
      }
    ]
  },
  generateRoutes ({ blueprintId, data }, prefix, staticRoot) {
    return [
      ...Object.keys(data.topLevel).map(async route => ({
        route: prefix(routePath(route)),
        payload: await importModule(join(staticRoot, blueprintId, `${trimSlash(route)}.json`))
      })),
      ...Object.keys(data.sources).map(async route => ({
        route: routePath(route),
        payload: await importModule(join(staticRoot, 'sources', route))
      }))
    ]
  },
  serverMiddleware ({ options, rootId, id }) {
    const { index, archive } = typeof options.api === 'function'
      ? options.api.call(this, { rootId, id })
      : options.api
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/blog/index')) {
          index.call(this, req, res, next)
        } else if (req.url.startsWith('/api/blog/archive')) {
          archive.(this, req, res, next)
        } else {
          next()
        }
      }
    ]
  },
  build: {
    before () {
      this.$addPressTheme('blueprints/blog/theme.css')
    },
    async compile (context) {
      await updateConfig.call(this, context)
    },
    async done (context) {
      if (!this.nuxt.options.dev) {
        return
      }

      const { options } = context

      let updatedEntry
      // TODO: prepare this for multiple instances
      const mdProcessor = await options.source.processor()
      const watchDir = options.dir
        ? `${options.dir}/`
        : options.dir

      const watcher = chokidar.watch([
        `${watchDir}*.md`,
        `${watchDir}**/*.md`
      ], {
        cwd: this.options.srcDir,
        ignoreInitial: true,
        ignored: 'node_modules/**/*'
      })
      watcher.on('add', async (path) => {
        updatedEntry = await parseEntry.call(this, context, path, mdProcessor)
        this.$pressSourceEvent('add', 'blog', updatedEntry)
      })
      watcher.on('change', async (path) => {
        updatedEntry = await parseEntry.call(this, context, path, mdProcessor)
        this.$pressSourceEvent('change', 'blog', updatedEntry)
      })
      watcher.on('unlink', path => this.$pressSourceEvent('unlink', 'blog', { path }))
    }
  },
  options: {
    dir: undefined,
    prefix: undefined,
    // Blog metadata
    title: 'A NuxtPress Blog',
    links: [],
    icons: [],

    feed: {
      // Replace with final link to your feed
      link: 'https://nuxt.press',
      // The <description> RSS tag
      description: 'A NuxtPress Blog Description',
      // Used in RFC4151-based RSS feed entry tags
      tagDomain: 'nuxt.press',
      // Final RSS path
      path: options => `${options.prefix}rss.xml`
    },

    // If in Nuxt's SPA mode, setting custom API
    // handlers also disables bundling of index.json
    // and source/*.json files into the static/ folder
    api ({ rootId }) {
      const cache = {}
      const rootDir = join(this.options.buildDir, rootId, 'static')
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'blog', 'index.json')
          }
          res.json(cache.index)
        },
        archive: (req, res, next) => {
          if (this.options.dev || !cache.archive) {
            cache.archive = readJsonSync(rootDir, 'blog', 'archive.json')
          }
          res.json(cache.archive)
        }
      }
    },

    source: {
      processor () {
        return new Markdown({
          toc: false,
          sanitize: false
        })
      },
      markdown (source, processor) {
        return processor.toMarkup(source).then(({ html }) => html)
      },

      // metadata() parses the starting block of text in a Markdown source,
      // considering the first and (optionally) second lines as
      // publishing date and summary respectively
      metadata (fileName, source) {
        if (source.trimLeft().startsWith('---')) {
          const { content, data } = graymatter(source)
          if (data.date) {
            data.published = new Date(Date.parse(data.date))
          }
          delete data.date
          return { ...data, content }
        }
        let published
        published = source.substr(0, source.indexOf('#')).trim()
        published = Date.parse(published)
        if (isNaN(published)) {
          return new Error(`Missing or invalid publication date in ${fileName} -- see documentation at https://nuxt.press`)
        }
        return {
          published: new Date(published)
        }
      },

      // path() determines the final URL path of a Markdown source
      // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
      path (fileName, { title, published }) {
        const slug = slugify(title || fileName)
        const date = published.toString().split(/\s+/).slice(1, 4).reverse()
        return `${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}/`
      },

      // id() determines the unique RSS ID of a Markdown source
      // Default RFC4151-based format is used. See https://tools.ietf.org/html/rfc4151
      id ({ published, path }) {
        const tagDomain = this.$press.blog.feed.tagDomain
        const year = published.getFullYear()
        return `tag:${tagDomain},${year}:${path}`
      },

      // title() determines the title of a Markdown source
      title (body) {
        const titleMatch = body.substr(body.indexOf('#')).match(/^#\s+(.*)/)
        return titleMatch ? titleMatch[1] : ''
      }
    }
  }
}
