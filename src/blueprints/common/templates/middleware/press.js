const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const trimSlashRE = /\/+$/

export default async function pressMiddleware (ctx, plugin = false) {
  const { app, route, $press, params, payload } = ctx

  if (process.server && !plugin) {
    return
  }

  $press.data = {}
  $press.layout = 'default'

  if (app.i18n) {
    const locale = app.i18n.locales
      .find(l => route.path.startsWith(`/${l.code}`))
    if (locale) {
      app.i18n.locale = locale.code
      $press.locale = locale.code
    } else {
      $press.locale = app.i18n.locale
    }
    $press.locales = app.i18n.locales
  }

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

  for (const m of pressMiddleware.extraMiddleware) {
    m(ctx)
  }
}

pressMiddleware.extraMiddleware = []
pressMiddleware.add = (middleware) => {
  pressMiddleware.extraMiddleware.push(middleware)
}
