const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const trimSlashRE = /\/+$/

export default async function ({ app, $press, params, payload }, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  $press.data = {}
  $press.layout = 'default'

  if (app.i18n) {
    $press.locale = app.i18n.locale
  }

  if (typeof params.source === 'string') {
    let source = payload
    let sourceParam = $press.locale ? `${$press.locale}/` : ''

    console.log('sourceParam', sourceParam)

    if (!source) {
      sourceParam = (params.source && params.source.replace(trimSlashRE, '')) || 'index'
      console.log('sourceParam', sourceParam)
      source = await $press.get(`api/source/${sourceParam}`)
    }

    if (!source) {
      source = await $press.get(`api/source/${sourceParam}/index`)
    }

    if (!source) {
      $press.error = { statusCode: 404 }
      return
    }
    $press.layout = source.layout || typeToLayout[source.type]
    $press.source = source
  }
}
