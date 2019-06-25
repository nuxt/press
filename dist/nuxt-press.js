'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

function _interopNamespace(e) {
  if (e && e.__esModule) { return e; } else {
    var n = {};
    if (e) {
      Object.keys(e).forEach(function (k) {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      });
    }
    n['default'] = e;
    return n;
  }
}

const defu = _interopDefault(require('defu'));
const os = _interopDefault(require('os'));
const consola = _interopDefault(require('consola'));
const fs = require('fs');
const path = require('path');
const util = require('util');
const klaw = _interopDefault(require('klaw'));
const fsExtra = require('fs-extra');
require('slug');

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
  const blueprint = await new Promise(function (resolve) { resolve(_interopNamespace(require(blueprintPath))); }).then(m => m.default);

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
