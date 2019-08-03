import NuxtPress from '../../src'

export default {
  modules: [
    [NuxtPress, 'docs'],
    'nuxt-i18n'
  ],
  i18n: {
    locales: ['en', 'pt-BR'],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        'en': {
          welcome: 'Welcome'
        },
        'pt-BR': {
          welcome: 'Benvindo'
        }
      }
    }
  }
}
