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

    let sourceParam
    if (!params.source && $press.locale) {
      sourceParam = $press.locale
    } else {
      sourceParam = `${$press.locale}${$press.locale ? '/' : ''}${params.source}`
    }

    if (!source) {
      sourceParam = sourceParam || 'index'
      source = await $press.get(`api/source/${sourceParam}`)
    }

    if (!source) {
      console.error('WHY AM I HERE ?', sourceParam)
      source = await $press.get(`api/source/${sourceParam}index`)
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
