#!/usr/bin/env node

const consola = require('consola')
const { NuxtCommand } = require('@nuxt/cli-edge')
const cli = require('../dist/cli.js')

NuxtCommand.run(cli)
