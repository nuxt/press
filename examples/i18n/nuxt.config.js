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
          title: 'I18n example',
          welcome: 'Welcome'
        },
        'pt-BR': {
          title: 'Exemplo I18n',
          welcome: 'Bem vindo'
        }
      }
    }
  }
}
