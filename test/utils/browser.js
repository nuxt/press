import fs from 'fs'
import path from 'path'
import env from 'node-env-file'
import { createBrowser } from 'tib'
import { browserString, useBrowserstackLocal } from '.'

export async function startBrowser({ folder, port, extendPage = {} }) {
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
    extendPage(page) {
      return {
        async navigate(path) {
          await page.runAsyncScript((path) => {
            return new Promise((resolve) => {
              window.$nuxt.$once('triggerScroll', resolve)
              window.$nuxt.$router.push(path)

              // timeout after 10s
              setTimeout(function() {
                console.error('browser: nuxt navigation timed out')
                window.$nuxt.$emit('triggerScroll')
              }, 10000)
            })
          }, path)
        },
        routeData() {
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
