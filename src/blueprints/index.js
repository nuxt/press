function importBlueprint (path) {
  return import(path).then(m => m.default || m)
}

export default {
  blog: () => importBlueprint('./blog'),
  common: () => importBlueprint('./common'),
  docs: () => importBlueprint('./docs'),
  slides: () => importBlueprint('./slides')
}
