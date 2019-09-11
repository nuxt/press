#!/usr/bin/env node

const { join, dirname } = require('path')
const { run } = require('@nuxt/blueprint')

const r = mode => join(dirname(require.resolve(`@nuxt-press/${mode}`)), 'blueprint')

run({
  name: 'press',
  autodiscover: {
    filter: ({ dir }) => !!dir
  },
  blueprints: {
    blog: r('blog'),
    core: r('core'),
    docs: r('docs'),
    slides: r('slides')
  }
})
