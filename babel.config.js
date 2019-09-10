module.exports = {
  'plugins': [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import'
  ],
  'env': {
    'test': {
      'presets': [
        [ '@babel/env', {
          'targets': {
            'node': 'current'
          }
        }]
      ]
    }
  }
}
