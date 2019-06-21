export default {
  routes(templates) {
    return [
      {
        name: 'source',
        path: '/:source(.+)',
        component: templates.source
      }
    ]
  }
}
