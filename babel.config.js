module.exports = {
  "env": {
    "test": {
      "plugins": [
        "@babel/plugin-proposal-class-properties"
      ],
      "presets": [
        [ "@babel/env", {
          "targets": {
            "node": "current"
          }
        }]
      ]
    }
  },
}
