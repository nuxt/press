export function routes(templates) {
  return [
    {
      name: 'source',
      path: '/:source(.+)',
      component: templates.source
    }
  ]
}
