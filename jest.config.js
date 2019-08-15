const stdEnv = require('std-env')

module.exports = {
  testEnvironment: 'node',

  expand: true,

  forceExit: true,

  setupFilesAfterEnv: ['./test/utils/setup'],

  coverageDirectory: './coverage',

  collectCoverageFrom: [
    'src/**/*.js'
  ],

  coveragePathIgnorePatterns: [
    'node_modules',
    '/templates/',
    '/test/',
  ],

  moduleNameMapper: {
    "@/(.*)$": "<rootDir>/test/$1",
    "~/(.*)$": "<rootDir>/src/$1",
    "^pressModule$": stdEnv.ci ? "<rootDir>/" : "<rootDir>/src/",
    "^press/blog/(.*)$": "<rootDir>/src/blueprints/blog/templates/$1",
    "^press/docs/(.*)$": "<rootDir>/src/blueprints/docs/templates/$1",
    "^press/common/(.*)$": "<rootDir>/src/blueprints/common/templates/$1",
    "^press/slides/(.*)$": "<rootDir>/src/blueprints/slides/templates/$1"
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
