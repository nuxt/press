import path from 'path'
import { readJSONSync } from 'fs-extra'
import commonjsPlugin from 'rollup-plugin-commonjs'
import autoExternalPlugin from 'rollup-plugin-auto-external'
import copyPlugin from 'rollup-plugin-copy'

const rootDir = process.cwd()
const inputs = {
  index: 'src/index.js',
  cli: 'src/cli.js'
}
const pkg = readJSONSync(path.resolve(rootDir, 'package.json'))
const name = path.basename(pkg.name)

export default [
  {
    input: path.resolve(rootDir, inputs.index),
    output: {
      dir: path.resolve(rootDir, 'dist'),
      entryFileNames: `nuxt-${name}.js`,
      chunkFileNames: `nuxt-${name}-[name].js`,
      format: 'cjs',
      preferConst: true
    },
    plugins: [
      autoExternalPlugin(),
      commonjsPlugin(),
      copyPlugin({
        targets: [
          { src: 'src/blueprints', dest: 'dist' }
        ]
      })
    ]
  },
  {
    input: path.resolve(rootDir, inputs.cli),
    output: {
      dir: path.resolve(rootDir, 'dist'),
      entryFileNames: `nuxt-${name}-cli.js`,
      chunkFileNames: `nuxt-${name}-cli-[name].js`,
      format: 'cjs',
      preferConst: true
    },
    plugins: [
      autoExternalPlugin(),
      commonjsPlugin()
    ]
  }
]
