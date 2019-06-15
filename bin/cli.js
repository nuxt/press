#!/usr/bin/env node

const consola = require('consola')
const { NuxtCommand } = require('@nuxt/cli')
const { cli } = require('../dist/')

NuxtCommand.run(cli)
