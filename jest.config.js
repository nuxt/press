const stdEnv = require('std-env')

module.exports = {
  testEnvironment: 'node',

  expand: true,

  forceExit: true,

  setupFilesAfterEnv: ['./test/utils/setup'],

  coverageDirectory: './coverage',

  collectCoverageFrom: [
    'src/**/*.js',
    '!**/templates/**',
    '!**/test/**'
  ],

  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/test/$1",
    "~/(.*)$": "<rootDir>/src/$1",
    "^pressModule$": stdEnv.ci ? "<rootDir>/" : "<rootDir>/src/"
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
