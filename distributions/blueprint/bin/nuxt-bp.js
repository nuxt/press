#!/usr/bin/env node

// this is a test file

const path = require('path')
const runBlueprint = require('../dist/run-blueprint.js')

runBlueprint({
  name: 'bp',
  bundles: {
    blog: path.join(path.dirname(require.resolve('@nuxt-press/blog')), 'blueprint'),
    docs: path.join(path.dirname(require.resolve('@nuxt-press/docs')), 'blueprint'),
    slides: path.join(path.dirname(require.resolve('@nuxt-press/slides')), 'blueprint')
  }
})
