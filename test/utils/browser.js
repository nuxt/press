import fs from 'fs'
import path from 'path'
import env from 'node-env-file'
import { createBrowser } from 'tib'
import { browserString, useBrowserstackLocal } from '.'

export function startBrowser ({ folder, port, extendPage = {} }) {
  if (useBrowserstackLocal) {
    const envFile = path.resolve(__dirname, '..', '..', '.env-browserstack')

    if (fs.existsSync(envFile)) {
      env(envFile)
    }
  }

  return createBrowser(browserString, {
    staticServer: {
      folder,
      port
    },
    extendPage (page) {
      return {
        async navigate (path) {
          await page.runAsyncScript((path) => {
            return new Promise((resolve) => {
              // timeout after 10s
              const timeout = setTimeout(function () {
                console.error('browser: nuxt navigation timed out')
                window.$nuxt.$emit('triggerScroll')
              }, 10000)

              window.$nuxt.$once('triggerScroll', () => {
                clearTimeout(timeout)
                setTimeout(resolve, 250)
              })
              window.$nuxt.$router.push(path)
            })
          }, path)
        },
        routeData () {
          return page.runScript(() => ({
            path: window.$nuxt.$route.path,
            query: window.$nuxt.$route.query
          }))
        },
        ...extendPage
      }
    }
  })
}
