const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

const trimSlashRE = /\/+$/

const extraMiddlewares = []

export default async function pressMiddleware (ctx, plugin = false) {
  if (process.server && !plugin) {
    return
  }

  const { app, route, $press, params, payload } = ctx

  $press.data = {}
  $press.layout = 'default'

  if (app.i18n) {
    $press.locales = app.i18n.locales

    if (!$press.locale || !route.path.startsWith(`/${$press.locale}`)) {
      const locale = app.i18n.locales.find(l => route.path.startsWith(`/${l.code}`))

      if (locale) {
        app.i18n.locale = locale.code
        $press.locale = locale.code
      } else {
        $press.locale = app.i18n.locale
      }
    }
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

  for (const extraMiddleware of extraMiddlewares) {
    extraMiddleware(ctx)
  }
}

pressMiddleware.add = middleware => extraMiddlewares.push(middleware)
