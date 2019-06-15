const path = require('path')
const { readJSONSync } = require('fs-extra')
const commonjsPlugin = require('rollup-plugin-commonjs')
const replacePlugin = require('rollup-plugin-replace')
const builtins = require('./builtins')

const rootDir = process.cwd()
const input = 'src/index.js'
const pkg = readJSONSync(path.resolve(rootDir, 'package.json'))
const name = path.basename(pkg.name)

export default {
  input: path.resolve(rootDir, input),
  output: {
    dir: path.resolve(rootDir, 'dist'),
    entryFileNames: `${name}.js`,
    chunkFileNames: `${name}-[name].js`,
    format: 'cjs',
    preferConst: true
  },
  external: [ builtins ],
  plugins: [
    replacePlugin({
      exclude: 'node_modules/**',
      delimiters: ['', ''],
      values: {
        __NODE_ENV__: process.env.NODE_ENV
      }
    }),
    commonjsPlugin()
  ]
}
