#!/usr/bin/env node

// this is a test file

const { join, dirname } = require('path')
const runBlueprint = require('../dist/run-blueprint.js')

runBlueprint({
  name: 'bp',
  appDir: 'press',
  filter: ({ dir }) => !!dir,
  blueprints: {
    blog: join(dirname(require.resolve('@nuxt-press/blog')), 'blueprint'),
    docs: join(dirname(require.resolve('@nuxt-press/docs')), 'blueprint'),
    slides: join(dirname(require.resolve('@nuxt-press/slides')), 'blueprint')
  }
})
