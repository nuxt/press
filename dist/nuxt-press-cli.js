'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

const consola = _interopDefault(require('consola'));

const cli = {
  name: 'press',
  description: 'CLI for @nuxt/press',
  usage: 'press <cmd>',
  run(cmd) {
    consola.info(cmd.argv);
  }
};

module.exports = cli;
