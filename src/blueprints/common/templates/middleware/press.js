const typeToLayout = {
  'entry': 'blog',
  'topic': 'docs',
  'slides': 'slides'
}

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

    // only change locale if it wasnt set or the current route doesnt use the set locale
    if (!$press.locale || $press.locale !== params.locale) {
      const locale = app.i18n.locales.find(locale => locale.code === params.locale)

      if (locale) {
        app.i18n.locale = locale.code
        $press.locale = locale.code
      } else {
        $press.locale = app.i18n.locale
      }
    }
  }

  let hasSource = typeof params.source === 'string'
  if (!hasSource) {
    const [matched] = route.matched

    hasSource = matched && matched.meta.sourceParam
  }

  if (hasSource) {
    let source = payload

    if (!source) {
      let sourcePath = route.path

      if ($press.locale) {
        let shouldAddLocale = sourcePath === '/'

        if (!shouldAddLocale && params.source) {
          shouldAddLocale = !sourcePath.match(new RegExp(`/${$press.locale}/?`))
        }

        if (shouldAddLocale) {
          sourcePath = `${sourcePath}${$press.locale}`
        }
      }

      source = await $press.get(`api/source${sourcePath}`)
    }

    if (!source) {
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
