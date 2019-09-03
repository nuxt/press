const stdEnv = require('std-env')

module.exports = {
  testEnvironment: 'node',

  expand: true,

  forceExit: true,

  setupFilesAfterEnv: ['./test/utils/setup'],

  coverageDirectory: './coverage',

  collectCoverageFrom: [
    'packages/**/*.js',
    '!**/blueprint/**',
    '!**/test/**'
  ],

  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/test/$1",
    "~/(.*)$": "<rootDir>/src/$1",
    // TODO: enable this again when we re-introduce a build step
    "^pressModule$": false && stdEnv.ci ? "<rootDir>/" : "<rootDir>/distributions/nuxt-press/src"
  },

  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': 'vue-jest'
  },

  moduleFileExtensions: [
    'js',
    'json'
  ],

  reporters: [
    'default',
    // ['jest-junit', { outputDirectory: 'reports/junit' }]
  ]
}
