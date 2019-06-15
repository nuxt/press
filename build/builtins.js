// Core logic from https://github.com/sindresorhus/builtin-modules
// Many thanks to @sindresorhus

const Module = require('module')

const blacklist = [ 'sys' ]
 
module.exports = Module.builtinModules
  .filter(x => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && !blacklist.includes(x))
  .sort()
