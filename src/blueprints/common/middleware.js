const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const trimSlashRE = /\/+$/

export default async function ({ $press, params, payload }, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  $press.layout = 'default'

  if (typeof params.source === 'string') {
    let source = payload
    let sourceParam

    if (!source) {
      sourceParam = (params.source && params.source.replace(trimSlashRE, '')) || 'index'
      source = await $press.get(`api/source/${sourceParam}`)
    }
    if (!source) {
      source = await $press.get(`api/source/${sourceParam}/index`)
    }
    if (!source) {
      $press.error = { statusCode: 404 }
      return
    }
    $press.layout = typeToLayout[source.type]
    $press.source = source
  }
}
