const stdEnv = require('std-env')

module.exports = {
  testEnvironment: 'node',

  expand: true,

  forceExit: true,

  setupFilesAfterEnv: ['./test/utils/setup'],

  coverageDirectory: './coverage',

  collectCoverageFrom: [
    '**/*.js'
  ],

  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/test/$1",
    "~/(.*)$": "<rootDir>/src/$1",
    "^press$": stdEnv.ci ? "<rootDir>/" : "<rootDir>/src/"
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
