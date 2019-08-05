const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const trimSlashRE = /\/+$/

export default async function ({ app, route, $press, params, payload }, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  $press.data = {}
  $press.layout = 'default'

  if (app.i18n) {
    const locale = app.i18n.locales
      .find(l => route.path.match(new RegExp(`^\\/${l}[^/]*`)))
    if (locale) {
      app.i18n.locale = locale
      $press.locale = locale
    } else {
      $press.locale = app.i18n.locale
    }
  }

  console.log('$press.locale', $press.locale)

  if (typeof params.source === 'string') {
    let source = payload

    let sourceParam = params.source === '' && $press.locale
      ? `${$press.locale}`
      : params.source

    if (!source) {
      sourceParam = (sourceParam && sourceParam.replace(trimSlashRE, '')) || 'index'
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
