'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

const defu = _interopDefault(require('defu'));
const os = _interopDefault(require('os'));
const consola = _interopDefault(require('consola'));
const fs = require('fs');
const path = require('path');
const util = require('util');
const klaw = _interopDefault(require('klaw'));
const fsExtra = require('fs-extra');
const slugify = _interopDefault(require('slug'));
const Markdown = _interopDefault(require('@nuxt/markdown'));
const webpack = require('webpack');

const maxRetries = 0; // use 0 for debugging
const pool = new Array(os.cpus().length).fill(null);

class PromisePool {
  constructor(jobs, handler) {
    this.handler = handler;
    this.jobs = jobs.map(payload => ({ payload }));
  }
  async done(before) {
    if (before) {
      await before();
    }
    await Promise.all(pool.map(() => {
      return new Promise(async (resolve) => {
        while (this.jobs.length) {
          let job;
          try {
            job = this.jobs.pop();
            await this.handler(job.payload);
          } catch (err) {
            if (job.retries && job.retries === maxRetries) {
              consola.warn('Job exceeded retry limit: ', job);
            } else {
              consola.warn('Job failed: ', job, err);
            }
          }
        }
        resolve();
      })
    }));
  }
}

const _stat = util.promisify(fs.stat);
const _readFile = util.promisify(fs.readFile);
const _writeFile = util.promisify(fs.writeFile);

function exists(...paths) {
  return fs.existsSync(join(...paths))
}

function resolve(...paths) {
  return path.resolve(__dirname, join(...paths))
}

function join(...paths) {
  return path.join(...paths.map(p => p.replace(/\//g, path.sep)))
}

function readFile(...paths) {
  return _readFile(join(...paths), 'utf-8')
}

function readJsonSync(...path) {
  return JSON.parse(fs.readFileSync(join(...path)).toString())
}

function walk(root, validate, sliceAtRoot = false) {
  const matches = [];
  const sliceAt = (sliceAtRoot ? root : this.options.srcDir).length + 1;
  if (validate instanceof RegExp) {
    const pattern = validate;
    validate = path => pattern.test(path);
  }
  return new Promise((resolve) => {
    klaw(root)
      .on('data', (match) => {
        const path = match.path.slice(sliceAt);
        if (validate(path)) {
          matches.push(path);
        }
      })
      .on('end', () => resolve(matches));
  })
}

// DOCS MODE
// Markdown files can be placed in
// Nuxt's srcDir or the docs/ directory.
// Directory configurable via press.docs.dir

async function parseDoc(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath);
  const fileName = path.parse(sourcePath).name;
  const markdownResult = await this
    .$press.docs.source.markdown.call(this, raw);
  let { toc } = markdownResult;
  const { html: body } = markdownResult;
  const title = this.$press.docs.source.title
    .call(this, fileName, raw);
  if (toc[0]) {
    toc[0][1] = title;
  } else if (['index', 'readme'].includes(fileName)) {
    // Force intro toc item if not present
    toc = [[1, 'Intro', '#intro']];
  }
  const source = { body, title, type: 'topic' };
  source.path = `${
    this.$press.docs.prefix
  }${
    this.$press.docs.source.path.call(this, fileName, source)
  }`;
  return { toc, source }
}

async function data (data) {
  const sources = {};

  let srcRoot = join(
    this.options.srcDir,
    this.$press.docs.dir
  );
  if (!exists(srcRoot)) {
    srcRoot = this.options.srcDir;
  }

  const index = {};
  const queue = new PromisePool(
    await walk.call(this, srcRoot, (path) => {
      if (path.startsWith('pages')) {
        return false
      }
      return /\.md$/.test(path)
    }),
    async (path) => {
      const { toc, source } = await parseDoc.call(this, path);
      for (const tocItem of toc) {
        tocItem[2] = `${source.path}${tocItem[2]}`;
        index[tocItem[2]] = tocItem;
      }
      sources[source.path] = source;
    }
  );
  await queue.done();

  return { topLevel: { index }, sources }
}

const docs = {
  // Include data loader
  data,
  enabled(options) {
    // Enable docs blueprint if srcDir/*.md files exists
    // or if the srcDir/docs/ folder exists
    return (
      fs.readdirSync(this.options.srcDir).find(p => /\.md$/.test(p)) ||
      exists(this.options.srcDir, options.dir)
    )
  },
  templates: {
    'plugin': 'plugin.js',
    'layout': 'layout.vue',
    'toc': 'components/toc.vue',
    'index': 'pages/index.vue',
    'topic': 'pages/topic.vue'
  },
  routes(templates) {
    return [
      {
        name: 'docs_index',
        path: this.$press.docs.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes(data, prefix, staticRoot) {
    return [
      {
        route: prefix('index'),
        payload: require(`${staticRoot}/sources/docs/topics/index.json`)
      },
      ...Object.keys(data.sources).map(route => ({
        route,
        payload: require(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  serverMiddleware({ options, rootId, id }) {
    const { index } = options.docs.api.call(this, { rootId, id });
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/docs/index')) {
          index(req, res, next);
        } else {
          next();
        }
      }
    ]
  },
  build: {
    before() {
      this.options.css.push(resolve('blueprints/docs/theme.css'));
    },
    async compile({ data }) {
      const pressJson = {
        toc: Object.keys(data.topLevel.index)
      };
      const pressJsonPath = join(this.options.srcDir, 'nuxt.press.json');
      if (!exists(pressJsonPath)) {
        await fsExtra.writeJson(pressJsonPath, pressJson, { spaces: 2 });
      }
    },
    done({ options }) {
      this.options.watch.push('~/*.md');
      this.options.watch.push(`~/${options.docs.dir}/*.md`);
    }
  },
  options: {
    dir: 'docs',
    prefix: '/docs',
    meta: {
      title: 'Documentation suite',
      github: 'https://github.com/...'
    },
    api({ rootId, id }) {
      const cache = {};
      const rootDir = join(this.options.buildDir, rootId, 'static');
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'docs', 'index.json');
          }
          res.json(cache.index);
        }
      }
    },
    source: {
      markdown(source) {
        const md = new Markdown(source, {
          sanitize: false
        });
        return md.getTocAndMarkup()
      },
      path(fileName, { title, published }) {
        if (['index', 'README'].includes(fileName)) {
          return '/topics/index'
        }
        const slug = title.replace(/\s+/g, '-');
        return `/topics/${slugify(slug).toLowerCase()}`
      },
      title(fileName, body) {
        if (['index', 'README'].includes(fileName)) {
          return 'Intro'
        }
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
};

// BLOG MODE
// Markdown files are loaded from the blog/ directory.
// Configurable via press.blog.dir

async function parseEntry(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath);
  const { published, summary } = this
    .$press.blog.source.head.call(this, raw);
  const title = this.$press.blog.source.title.call(this, raw);
  const body = await this.$press.blog.source.markdown
    .call(this, raw.substr(raw.indexOf('#')));
  const source = { body, title, published, summary };
  source.path = `${
    this.$press.blog.prefix
  }${
    this.$press.blog.source.path.call(this, source)
  }`;
  source.type = 'entry';
  source.id = this.$press.blog.source.id.call(this, source);
  return source
}

function addArchiveEntry(archive, entry) {
  const year = entry.published.getFullYear();
  const month = (entry.published.getMonth() + 1)
    .toString()
    .padStart(2, '0');
  if (!archive[year]) {
    archive[year] = {};
  }
  if (!archive[year][month]) {
    archive[year][month] = [];
  }
  archive[year][month].push(entry);
}

async function data$1 () {
  const srcRoot = join(
    this.options.srcDir,
    this.$press.blog.dir
  );

  const sources = {};
  const archive = {};

  const queue = new PromisePool(
    await walk.call(this, srcRoot, (path) => {
      if (path.startsWith('pages')) {
        return false
      }
      return /\.md$/.test(path)
    }),
    async (path) => {
      const entry = await parseEntry.call(this, path);
      addArchiveEntry(archive, entry);
      sources[entry.path] = entry;
    }
  );
  await queue.done();

  const index = Object.values(sources)
    .sort((a, b) => b.published - a.published)
    .slice(0, 10);

  return { topLevel: { index, archive }, sources }
}

const blog = {
  // Include data loader
  data: data$1,
  enabled(options) {
    // Enable blog if srcDir/blog/ exists
    return exists(join(this.options.srcDir, options.dir))
  },
  templates: {
    'assets': /\.svg$/,
    'layout': 'layout.vue',
    'sidebar': 'components/sidebar.vue',
    'index': 'pages/index.vue',
    'entry': 'pages/entry.vue',
    'archive': 'pages/archive.vue'
  },
  ejectable: [
    'layout',
    'sidebar',
    'index',
    'entry',
    'archive'
  ],
  routes(templates) {
    return [
      {
        name: 'blog_index',
        path: this.$press.blog.prefix,
        component: templates.index
      },
      {
        name: 'blog_archive',
        path: `${this.$press.blog.prefix}/archive`,
        component: templates.archive
      }
    ]
  },
  generateRoutes(data, prefix, staticRoot) {
    return [
      ...Object.keys(data.topLevel).map(route => ({
        route: prefix(route),
        payload: require(`${staticRoot}/blog/${route}.json`)
      })),
      ...Object.keys(data.sources).map(route => ({
        route,
        payload: require(`${staticRoot}/sources${route}`)
      }))
    ]
  },
  serverMiddleware({ options, rootId, id }) {
    const { index, archive } = this.$press.blog.api.call(this, { rootId, id });
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/blog/index')) {
          index.call(this, req, res, next);
        } else if (req.url.startsWith('/api/blog/archive')) {
          archive.call(this, req, res, next);
        } else {
          next();
        }
      }
    ]
  },
  build: {
    before() {
      this.options.css.push(resolve('blueprints/blog/theme.css'));
    }
  },
  buildDone({ options }) {
    this.options.watch.push(`~/${options.blog.dir}*.md`);
    this.options.watch.push(`~/${options.blog.dir}**/*.md`);
  },
  options: {
    dir: 'blog',
    prefix: '/blog',

    // Blog metadata
    meta: {
      title: 'A NuxtPress Blog',
      links: [],
      icons: [],
      // Used in RFC4151-based RSS feed entry tags
      tagDomain: 'nuxt.press'
    },

    // If in Nuxt's SPA mode, setting custom API
    // handlers also disables bundling of index.json
    // and source/*.json files into the static/ folder
    api({ rootId }) {
      const cache = {};
      const rootDir = join(this.options.buildDir, rootId, 'static');
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'blog', 'index.json');
          }
          res.json(cache.index);
        },
        archive: (req, res, next) => {
          if (this.options.dev || !cache.archive) {
            cache.archive = readJsonSync(rootDir, 'blog', 'archive.json');
          }
          res.json(cache.archive);
        }
      }
    },

    source: {
      async markdown(source) {
        const md = new Markdown(source, {
          skipToc: true,
          sanitize: false
        });
        const html = await md.toHTML();
        return html.contents
      },

      // head() parses the starting block of text in a Markdown source,
      // considering the first and (optionally) second lines as
      // publishing date and summary respectively
      head(source) {
        const parsed = source
          .substr(0, source.indexOf('#')).trim().split(/\n\n/);
        const published = new Date(Date.parse(parsed[0]));
        return { published, summary: parsed[1] }
      },

      // path() determines the final URL path of a Markdown source
      // In `blog` mode, the default format is /YYYY/MM/DD/<slug>
      path({ title, published }) {
        const slug = slugify(title.replace(/\s+/g, '-')).toLowerCase();
        const date = published.toString().split(/\s+/).slice(1, 4).reverse();
        return `/${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}`
      },

      // id() determines the unique RSS ID of a Markdown source
      // Default RFC4151-based format is used. See https://tools.ietf.org/html/rfc4151
      id({ published, path }) {
        const tagDomain = this.$press.blog.meta.tagDomain;
        const year = published.getFullYear();
        return `tag:${tagDomain},${year}:${path}`
      },

      // title() determines the title of a Markdown source
      title(body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
};

// SLIDES MODE
// Markdown files are loaded from the slides/ directory.
// Configurable via press.slides.dir

async function parseSlides(sourcePath) {
  const raw = await readFile(this.options.srcDir, sourcePath);
  let slides = [];
  let c;
  let i = 0;
  let s = 0;
  let escaped = false;
  for (i = 0; i < raw.length; i++) {
    c = raw.charAt(i);
    if (c === '\n') {
      if (raw.charAt(i + 1) === '`' && raw.slice(i + 1, i + 4) === '```') {
        escaped = !escaped;
        i = i + 3;
        continue
      }
      if (escaped) {
        continue
      }
      if (raw.charAt(i + 1) === '#') {
        if (raw.slice(i + 2, i + 3) !== '#') {
          slides.push(raw.slice(s, i).trimStart());
          s = i;
        }
      }
    }
  }
  slides.push(slides.length > 0
    ? raw.slice(s, i).trimStart()
    : raw
  );
  slides = await Promise.all(
    slides.filter(Boolean).map((slide) => {
      return this.$press.slides.source.markdown.call(this, slide)
    })
  );
  const source = { slides, type: 'slides' };
  source.path = this.$press.slides.source.path
    .call(this, path.parse(sourcePath).name.toLowerCase());
  return source
}

async function data$2 () {
  const sources = {};

  const srcRoot = join(
    this.options.srcDir,
    this.$press.slides.dir
  );

  const pool = new PromisePool(
    await walk.call(this, srcRoot, (path) => {
      if (path.startsWith('pages')) {
        return false
      }
      return /\.md$/.test(path)
    }),
    async (path) => {
      const slides = await parseSlides.call(this, path);
      sources[slides.path] = slides;
    }
  );
  await pool.done();

  const index = Object.values(sources);

  return { topLevel: { index }, sources }
}

const slides = {
  // Include data loader
  data: data$2,
  // Enable slides blueprint if srcDir/slides/*.md files exist
  enabled(options) {
    return exists(join(this.options.srcDir, options.dir))
  },
  templates: {
    plugin: ['plugin.js', { ssr: false }],
    layout: 'layout.vue',
    index: 'pages/index.vue',
    slides: 'pages/slides.vue'
  },
  // Register routes once templates have been added
  routes(templates) {
    return [
      {
        name: 'slides_index',
        path: this.$press.slides.prefix,
        component: templates.index
      }
    ]
  },
  generateRoutes(data, _, staticRoot) {
    return Object.keys(data.sources).map(route => ({
      route,
      payload: require(`${staticRoot}/sources${route}`)
    }))
  },
  // Register serverMiddleware
  serverMiddleware({ options, rootId, id }) {
    const { index } = options.slides.api.call(this, { rootId, id });
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/slides/index')) {
          index(req, res, next);
        } else {
          next();
        }
      }
    ]
  },
  build: {
    before() {
      this.options.css.push(resolve('blueprints/slides/theme.css'));
    },
    done({ options }) {
      this.options.watch.push(`~/${options.slides.dir}*.md`);
    }
  },
  // Options are merged into the parent module default options
  options: {
    dir: 'slides',
    prefix: '/slides',
    api({ rootId }) {
      const cache = {};
      const rootDir = join(this.options.buildDir, rootId, 'static');
      return {
        index: (req, res, next) => {
          if (this.options.dev || !cache.index) {
            cache.index = readJsonSync(rootDir, 'slides', 'index.json');
          }
          res.json(cache.index);
        }
      }
    },
    source: {
      async markdown(source) {
        const md = new Markdown(source, { sanitize: false });
        const html = await md.toHTML();
        return html.contents
      },
      // path() determines the final URL path of a Markdown source
      // In 'slides' mode, the default format is <prefix>/slides/<slug>
      path(fileName) {
        return `/slides/${fileName.toLowerCase()}`
      }
    }
  }
};

// PAGES
// Markdown files under pages/ are treated as individual
// Nuxt routes using the ejectable page template

// Custom pages can be added by ensuring there's
// a .vue file matching the .md file. The processed
// contents of the .md file become available as $page
// in the custom Vue component for the page

async function loadPage(pagePath) {
  const sliceAt = join(this.options.srcDir, this.options.dir.pages).length;
  let body = await readFile(this.options.srcDir, pagePath);
  const titleMatch = body.match(/^#\s+(.*)/);
  const title = titleMatch ? titleMatch[1] : '';
  body = await this.$press.common.source.markdown.call(this, body);
  const parsed = path.parse(pagePath);
  const path$1 = `${parsed.dir.slice(sliceAt)}/${parsed.name}`;
  return { body, title, path: path$1 }
}

async function data$3 () {
  const pagesRoot = join(
    this.options.srcDir,
    this.options.dir.pages
  );
  const pages = {};
  const queue = new PromisePool(
    await walk.call(this, pagesRoot, /\.md$/),
    async (path) => {
      // Somehow eslint doesn't detect func.call(), so:
      // eslint-disable-next-line no-use-before-define
      const page = await loadPage.call(this, path);
      pages[page.path] = page;
    }
  );
  await queue.done();
  return { sources: pages }
}

const common = {
  // Include data loader
  data: data$3,
  // Main blueprint, enabled by default
  enabled: () => true,
  templates: {
    'plugin': 'plugin.js',
    'scroll/plugin': ['plugins/scroll.js', { ssr: false }],
    'observer': 'components/observer.js',
    'nuxt-template': 'components/nuxt-template.js',
    'source': 'pages/source.vue'
  },
  routes(templates) {
    return [
      {
        name: 'source',
        path: '/:source(.+)',
        // Final path might be under srcDir or buildDir
        // Depends on presence of user-provided template
        // And is the reason why templates is passed to this function
        component: templates.source
      }
    ]
  },
  generateRoutes(data, _, staticRoot) {
    return Object.keys(data.sources).map((route) => {
      if (route.endsWith('/index')) {
        route = route.slice(0, route.indexOf('/index'));
      }
      return {
        route,
        payload: require(`${staticRoot}/sources${route}`)
      }
    })
  },
  serverMiddleware({ options, rootId, id }) {
    const { source } = options.common.api.call(this, { rootId, id });
    return [
      (req, res, next) => {
        if (req.url.startsWith('/api/source/')) {
          source.call(this, req, res, next);
        } else {
          next();
        }
      }
    ]
  },
  hooks: {
    build: {
      async before() {
        this.options.build.plugins.unshift(new webpack.IgnorePlugin(/\.md$/));
        const pagesDir = join(this.options.srcDir, this.options.dir.pages);
        if (!exists(pagesDir)) {
          this.$press.$placeholderPagesDir = pagesDir;
          await fsExtra.ensureDir(pagesDir);
        }
      },
      async compile() {
        if (this.$press.$placeholderPagesDir) {
          await fsExtra.remove(this.$press.$placeholderPagesDir);
        }
      },
      done() {
        this.options.watch.push('~/pages/*.md');
      }
    }
  },
  options: {
    api({ rootId }) {
      const rootDir = join(this.options.buildDir, rootId, 'static');
      const sourceCache = {};
      return {
        source(req, res, next) {
          const source = req.url.slice(12);
          if (!sourceCache[source]) {
            sourceCache[source] = readJsonSync(rootDir, 'sources', `${source}.json`);
          }
          res.json(sourceCache[source]);
        }
      }
    },
    source: {
      markdown(source) {
        const md = new Markdown(source, { sanitize: false });
        return md.toHTML().then(html => html.contents)
      },
      title(body) {
        return body.substr(body.indexOf('#')).match(/^#\s+(.*)/)[1]
      }
    }
  }
};

const blueprints = { docs, blog, slides, common };

async function registerBlueprints(rootId, options, blueprints) {
  // rootId: root id (used to define directory and config key)
  // options: module options (as captured by the module function)
  // blueprints: blueprint loading order
  for (const bp of blueprints) { // ['slides', 'common']) {
    await _registerBlueprint.call(this, bp, rootId, options);
  }
}

// TODO
// possible enhancement if released as a standalone library:
// refactor to allow registering a single, top-level blueprint
async function _registerBlueprint(id, rootId, options = {}) {
  // Load blueprint specification
  const blueprintPath = resolve(`blueprints/${id}`);
  // TODO This line was breaking the rollup build, figure out workaround
  // const blueprint = await blueprints[ import(blueprintPath).then(m => m.default)]
  const blueprint = blueprints[id];
  // Return if blueprint is not enabled
  if (!blueprint.enabled.call(this, blueprint.options)) {
    return
  }

  // Set global rootId if unset
  if (!this.options[rootId]) {
    this.options[rootId] = {};
  }
  if (!this[`$${rootId}`]) {
    this[`$${rootId}`] = this.options[rootId];
  }

  // Prefer top-level config key in nuxt.config.js
  Object.assign(this.options[rootId], defu(this.options[rootId], options));

  if (blueprint.options) {
    if (this.options[rootId][id]) {
      Object.assign(this.options[rootId][id], defu(this.options[rootId][id], blueprint.options));
    } else {
      this.options[rootId][id] = blueprint.options;
    }
  }

  // Set flag to indicate blueprint was enabled
  this.options[rootId][`$${id}`] = true;

  // For easy config acess in helper functions
  options = this.options[rootId];

  // Register serverMiddleware
  for (let sm of await blueprint.serverMiddleware.call(this, { options, rootId, id })) {
    sm = sm.bind(this);
    this.addServerMiddleware(async (req, res, next) => {
      try {
        await sm(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }

  this.nuxt.hook('build:before', async () => {
    const context = { options, rootId, id };
    const templates = await addTemplates.call(this, context, blueprint.templates);

    context.data = await blueprint.data.call(this);

    if (blueprint.build && blueprint.build.before) {
      await blueprint.build.before.call(this, context);
    }

    if (blueprint.routes) {
      const routes = await blueprint.routes.call(this, templates);
      this.extendRoutes((nuxtRoutes, resolve) => {
        for (const route of routes) {
          if (exists(join(this.options.srcDir, route.component))) {
            route.component = join('~', route.component);
          } else {
            route.component = join(this.options.buildDir, route.component);
          }
        }
        nuxtRoutes.push(...routes);
      });
    }

    const staticRoot = join(this.options.buildDir, rootId, 'static');
    await saveStaticData.call(this, staticRoot, id, context.data);

    this.nuxt.hook('build:compile', async () => {
      const staticRoot = join(this.options.buildDir, rootId, 'static');
      await saveStaticData.call(this, staticRoot, id, context.data);

      if (blueprint.build && blueprint.build.done) {
        this.nuxt.hook('build:done', async () => {
          await blueprint.build.done.call(this, context);
          this.options.generate.routes = () => {
            return options.$generateRoutes.reduce((routes, route) => [...routes, ...route()])
          };
        });
      }

      if (blueprint.build && blueprint.build.compile) {
        await blueprint.build.compile.call(this, context);
      }

      if (blueprint.generateRoutes) {
        if (!options.$generateRoutes) {
          options.$generateRoutes = [];
        }
        const pathPrefix = path => `${blueprint.options.prefix}${path}`;
        options.$generateRoutes.push(() => {
          return blueprint.generateRoutes.call(this, context.data, pathPrefix, staticRoot)
        });
      }

      this.nuxt.hook('generate:distCopied', async () => {
        const staticRootGenerate = join(this.options.generate.dir, rootId);
        await fsExtra.ensureDir(staticRootGenerate);
        await saveStaticData.call(this, staticRootGenerate, id, context.data);
      });
    });
  });
}

async function saveStaticData(staticRoot, id, data) {
  await fsExtra.ensureDir(join(staticRoot, id));
  const { topLevel, sources } = data;
  if (topLevel) {
    for (const topLevelKey of Object.keys(topLevel)) {
      const topLevelPath = join(staticRoot, id, `${topLevelKey}.json`);
      await fsExtra.ensureDir(path.dirname(topLevelPath));
      await fsExtra.writeJson(topLevelPath, topLevel[topLevelKey]);
    }
  }
  if (sources) {
    const pool = new PromisePool(
      Object.values(sources),
      async (source) => {
        const sourcePath = join(staticRoot, 'sources', `${source.path}.json`);
        if (!exists(path.dirname(sourcePath))) {
          await fsExtra.ensureDir(path.dirname(sourcePath));
        }
        await fsExtra.writeJson(sourcePath, source);
      }
    );
    await pool.done();
  }
}

async function addTemplateAssets({ options, rootId, id }, pattern) {
  const srcDir = resolve('blueprints', id);
  const srcList = await walk.call(this, srcDir, pattern, true);
  const pool = new PromisePool(srcList, (src) => {
    const srcPath = resolve('blueprints', id, src);
    this.addTemplate({
      src: srcPath,
      fileName: join(rootId, 'assets', id, src.replace(`assets/`, ''))
    });
  });
  await pool.done();
}

async function addTemplates({ options, rootId, id }, templates) {
  const finalTemplates = {};
  const sliceAt = resolve('blueprints').length + 1;
  for (const templateKey of Object.keys(templates)) {
    if (templateKey === 'assets') {
      await addTemplateAssets.call(this, { options, rootId, id }, templates[templateKey]);
      continue
    }
    const templateSpec = templates[templateKey];
    const isTemplateArr = Array.isArray(templateSpec);
    const template = {
      src: isTemplateArr ? templateSpec[0] : templateSpec,
      ...isTemplateArr && templateSpec[1]
    };

    // Pick up user-provide template replacements
    const userProvidedTemplate = join(this.options.srcDir, rootId, id, template.src);
    if (exists(userProvidedTemplate)) {
      template.src = userProvidedTemplate;
    } else {
      template.src = resolve('blueprints', id, template.src);
    }

    template.fileName = join(rootId, template.src.slice(sliceAt));
    finalTemplates[templateKey] = template.fileName;

    if (templateKey === 'plugin' || templateKey.endsWith('/plugin')) {
      this.addPlugin({ ...template, options });
      continue
    }

    if (templateKey === 'layout' || templateKey.endsWith('/layout')) {
      this.addLayout({ ...template, options }, id);
      continue
    }

    // Regular Vue templates (also usable as routes)
    this.addTemplate({ ...template, options });
  }
  // console.log('finalTemplates', finalTemplates)
  // process.exit()

  return finalTemplates
}

async function index (options) {
  // Use the full Vue build for client-side template compilation
  this.extendBuild((config) => {
    config.resolve.alias.vue$ = 'vue/dist/vue.esm.js';
  });

  // Enable all of https://preset-env.cssdb.org/features
  this.options.build.postcss.preset.stage = 0;

  // Automatically register module dependencies
  this.requireModule({
    src: '@nuxt/http',
    options: { browserBaseURL: '/' }
  });

  // Register stylesheets
  this.options.css.push(
    'prismjs/themes/prism.css',
    resolve('blueprints/common/default.css')
  );

  // Common helper for writing JSON responses
  this.addServerMiddleware((_, res, next) => {
    res.json = (data) => {
      res.type = 'application/json';
      res.write(JSON.stringify(data));
      res.end();
    };
    next();
  });

  // Load and register blueprints from './blueprints'
  await registerBlueprints.call(this, 'press', options, ['docs', 'blog', 'slides', 'common']);
}

module.exports = index;
