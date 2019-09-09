import fs from 'fs'
import path from 'path'
import consola from 'consola'
import defu from 'defu'
import { Module } from '@nuxt/core-edge'
import {
  ucfirst,
  runOnceGuard,
  createFileFilter,
  walk,
  exists,
  readFile,
  copyFile,
  ensureDir
} from './utils'

const defaultOptions = {
  autodiscover: true,
  pluginsStrategy: 'unshift'
}

export default class Blueprint extends Module {
  static features = {}

  constructor (nuxt, options = {}) {
    // singleton blueprints dont support being loaded twice
    if (new.target.features.singleton && !runOnceGuard(new.target, 'constructed')) {
      throw new Error(`${new.target.name}: trying to load a singleton blueprint which is already loaded`)
    }

    super(nuxt)

    this.id = options.id || this.constructor.id || 'blueprint'

    this.blueprintOptions = defu(options, defaultOptions)

    this.templateOptions = this.blueprintOptions
  }

  setup () {
    if (!runOnceGuard(Blueprint, 'setup')) {
      return
    }

    const webpackAliases = this.blueprintOptions.webpackAliases
    if (webpackAliases) {
      this.extendBuild((config) => {
        const aliases = typeof webpackAliases === 'string' ? [webpackAliases] : webpackAliases

        for (const alias of aliases) {
          if (Array.isArray(alias)) {
            const [_alias, _path] = alias
            config.resolve.alias[_alias] = _path
          } else {
            config.resolve.alias[alias] = path.join(this.nuxt.options.buildDir, alias)
          }
        }
      })
    }
  }

  init (files) {
    this.setup()

    this.nuxt.hook('builder:prepared', async () => {
      if (this.blueprintOptions.autodiscover) {
        const autodiscoveredFiles = await this.autodiscover()
        await this.resolveFiles(autodiscoveredFiles)
      }

      if (files) {
        await this.resolveFiles(files)
      }
    })
  }

  createTemplatePaths (filePath, rootDir, prefix) {
    if (typeof filePath !== 'string') {
      return filePath
    }

    rootDir = rootDir || this.blueprintOptions.dir

    return {
      src: path.join(rootDir, filePath),
      dst: prefix ? path.join(prefix || '', filePath) : filePath
    }
  }

  async autodiscover (rootDir, { validate, filter } = {}) {
    rootDir = rootDir || this.blueprintOptions.dir

    if (!rootDir || !await exists(rootDir)) {
      return {}
    }

    filter = createFileFilter(filter)
    const files = await walk(rootDir, { validate })
    const filesByType = {}

    for (const file of files) {
      if (!file) {
        continue
      }

      const parsedFile = path.parse(file)

      // TODO: fix sub folders
      const { dir: type, ext } = parsedFile

      // dont add anything without an extension -> not a proper file
      if (!type && !ext) {
        continue
      }
      // filter files
      if (filter && !filter(parsedFile)) {
        continue
      }

      filesByType[type] = filesByType[type] || []
      filesByType[type].push(this.createTemplatePaths(file, rootDir))
    }

    return filesByType
  }

  async resolveFiles (files, pathPrefix) {
    pathPrefix = pathPrefix || this.id

    // use an instance var to keep track
    // of final template src/dst mappings
    this.filesMapping = {}

    for (const type in files) {
      // TODO: load ejected user templates instead---
      const typeFiles = files[type].map((file) => {
        if (typeof file === 'string') {
          return this.createTemplatePaths(file, undefined, pathPrefix)
        }

        return {
          ...file,
          dst: path.join(pathPrefix, file.dst),
          dstRelative: file.dst
        }
      })

      // Turns 'modules' into 'addModules'
      const methodName = `add${ucfirst(type)}`

      // If methodName function exists that means there are
      // files with a special meaning for Nuxt.js (ie modules, plugins)
      if (this[methodName]) {
        await this[methodName](typeFiles)
        continue
      }

      // The files are just some generic js/vue files, but can be templates
      await this.addFiles(typeFiles, type)
    }

    // convert absolute paths in fileMapping
    // to relative paths from the nuxt.buildDir
    // also creates a copy of filesMapping in the process
    // so successive resolveFiles calls dont overwrite the
    // same object already returned to the user
    const relativeFilesMapping = {}
    for (const key in this.filesMapping) {
      const filePath = this.filesMapping[key]

      if (path.isAbsolute(filePath)) {
        relativeFilesMapping[key] = path.relative(this.nuxt.options.buildDir, filePath)
        continue
      }

      relativeFilesMapping[key] = filePath
    }

    return relativeFilesMapping
  }

  async copyFile ({ src, dst }) {
    // TODO: can this be removed?
    if (!path.isAbsolute(dst)) {
      dst = path.join(this.nuxt.options.buildDir, dst)
    }

    try {
      consola.debug(`${this.constructor.name}: Copying '${path.relative(this.nuxt.options.srcDir, src)}' to '${path.relative(this.nuxt.options.buildDir, dst)}'`)

      await ensureDir(path.dirname(dst))
      await copyFile(src, dst, fs.constants.COPYFILE_FICLONE)
      return dst
    } catch (err) {
      consola.error(`${this.constructor.name}: An error occured while copying ${path.relative(this.nuxt.options.srcDir, src)}' to '${path.relative(this.nuxt.options.buildDir, dst)}'\n`, err)
      return false
    }
  }

  addTemplateIfNeeded ({ src, dst, dstRelative } = {}) {
    if (!src) {
      return
    }

    const templateSuffices = ['tmpl', '$tmpl', 'template', '$template']

    let templatePath
    for (const suffix of templateSuffices) {
      if (src.includes(`.${suffix}.`)) {
        // if user provided a custom dst, use that
        if (!src.endsWith(dstRelative)) {
          templatePath = dst
          break
        }

        const { name, ext } = path.parse(src)

        // if template suffix starts with $
        // create a unique but predictable name by replacing
        // the template indicator by this.id
        // TODO: normalize id?
        const id = suffix[0] === '$' ? `.${this.id}` : ''
        templatePath = path.join(path.dirname(dst), `${path.basename(name, `.${suffix}`)}${id}${ext}`)
        break
      }
    }

    // its a template
    if (templatePath) {
      const { dst: templateDst } = this.addTemplate({
        src,
        fileName: templatePath,
        options: this.templateOptions
      })

      this.filesMapping[dstRelative] = templateDst

      return templateDst
    }

    this.filesMapping[dstRelative] = src
    return src
  }

  async addTemplateOrCopy ({ src, dst, dstRelative } = {}) {
    const dest = this.addTemplateIfNeeded({ src, dst, dstRelative })

    if (dest === src) {
      await this.copyFile({ src, dst })
      return dst
    }

    return dest
  }

  addFiles (files, type) {
    return Promise.all(files.map(file => this.addTemplateOrCopy(file)))
  }

  addAssets (assets) {
    // TODO: run addAssets more than once while adding just one plugin
    // or set unique webpack plugin name
    const emitAssets = (compilation) => {
      // Note: the order in which assets are emitted is not stable
      return Promise.all(assets.map(async ({ src, dst }) => {
        const assetBuffer = await readFile(src)

        compilation.assets[dst] = {
          source: () => assetBuffer,
          size: () => assetBuffer.length
        }
      }))
    }

    // add webpack plugin
    this.nuxt.options.build.plugins.push({
      apply (compiler) {
        compiler.hooks.emit.tapPromise(`${this.id}BlueprintPlugin`, emitAssets)
      }
    })
  }

  async addLayouts (layouts) {
    for (const layout of layouts) {
      const layoutPath = await this.addTemplateOrCopy(layout)

      const { name: layoutName } = path.parse(layoutPath)
      const existingLayout = this.nuxt.options.layouts[layoutName]

      if (existingLayout) {
        consola.warn(`Duplicate layout registration, "${layoutName}" has been registered as "${existingLayout}"`)
        continue
      }

      // Add to nuxt layouts
      this.nuxt.options.layouts[layoutName] = `./${layoutPath}`
    }
  }

  async addModules (modules) {
    for (const module of modules) {
      const modulePath = this.addTemplateIfNeeded(module)
      await this.addModule(modulePath)
    }
  }

  async addPlugins (plugins) {
    const newPlugins = []
    // dont use addPlugin here due to its addTemplate use
    for (const plugin of plugins) {
      const pluginPath = await this.addTemplateOrCopy(plugin)

      // Add to nuxt plugins
      newPlugins.push({
        src: path.join(this.nuxt.options.buildDir, pluginPath),
        // TODO: remove deprecated option in Nuxt 3
        ssr: plugin.ssr,
        mode: plugin.mode
      })
    }

    // nuxt default behaviour is to put new plugins
    // at the front of the array, so thats what we
    // want do as well. But we want to maintain
    // order of the files
    // TODO: check if walk is stable in the order of resolving files
    const pluginsStrategy = this.blueprintOptions.pluginsStrategy
    if (typeof pluginsStrategy === 'function') {
      pluginsStrategy(this.nuxt.options.plugins, newPlugins)
      return
    }

    if (!this.nuxt.options.plugins[pluginsStrategy]) {
      throw new Error(`Unsupported plugin strategy ${pluginsStrategy}`)
    }

    this.nuxt.options.plugins[pluginsStrategy](...newPlugins)
  }

  addStatic (staticFiles) {
    this.nuxt.hook('build:done', () => {
      return Promise.all(staticFiles.map((file) => {
        return this.copyFile(this.createTemplatePaths(file))
      }))
    })
  }

  addStyles (stylesheets) {
    for (const stylesheet of stylesheets) {
      if (!this.nuxt.options.css.includes(stylesheet)) {
        this.nuxt.options.css.push(stylesheet)
      }
    }
  }

  addApp () {
    // eslint-disable-next-line no-consola
    consola.warn(`${this.constructor.name}: app overrides are not yet implemented`)
  }

  addStore () {
    // eslint-disable-next-line no-consola
    consola.warn(`${this.constructor.name}: adding store modules from blueprints is not yet implemented`)
  }
}
