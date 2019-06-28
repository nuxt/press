const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

export default async function({ $press, params, payload }) {
  $press.layout = 'default'
  if (typeof params.source === 'string') {
    let source = payload
    if (params.source === '') {
      params.source = 'index'
    }
    if (!source) {
      source = await $press.get(`api/source/${params.source}`)
    }
    if (!source) {
      source = await $press.get(`api/source/${params.source}/index`)
    }
    if (!source) {
      $press.error = { statusCode: 404 }
      return
    }
    $press.layout = typeToLayout[source.type]
    $press.source = source
  }
}
