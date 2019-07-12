import fs from 'fs'
import path from 'path'
import express from 'express'
import serveStatic from 'serve-static'
import env from 'node-env-file'
import { createBrowser as _createBrowser } from 'tib'
import { browserString, useBrowserstackLocal, getPort, waitFor } from '.'

export async function startStaticServer(folder, port, host) {
  const app = express()

  app.use(serveStatic(folder))

  port = process.env.PORT || port || 3000
  host = process.env.HOST || host || 'localhost'

  app.listen(port, host)

  console.info(`Static test server started on http://${host}:${port}`)

  // wait before continuing so we can test the server manually
  const waitTime = parseInt(process.env.WAIT)
  if (waitTime) {
    await waitFor(waitTime)
  }

  return { server: app, host, port }
}

export async function prepareBrowser(folder) {
  if (useBrowserstackLocal) {
    const envFile = path.resolve(__dirname, '..', '..', '.env-browserstack')

    if (fs.existsSync(envFile)) {
      env(envFile)
    }

    return {}
  }

  const port = await getPort()
  const info = await startStaticServer(folder, port)

  return info
}

export async function createBrowser({ folder, extendPage = {} }) {
  return _createBrowser(browserString, {
    BrowserStackLocal: { folder },
    extendPage(page) {
      return {
        async navigate(path) {
          await page.runAsyncScript((path) => {
            return new Promise((resolve) => {
              window.$nuxt.$once('triggerScroll', resolve)
              window.$nuxt.$router.push(path)
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

export async function startBrowser(folder) {
  const serverInfo = await prepareBrowser(folder)

  const browser = await createBrowser({ folder })

  browser.serverInfo = serverInfo

  browser.getUrl = (urlPath) => {
    if (browser.getLocalFolderUrl) {
      return browser.getLocalFolderUrl(urlPath)
    } else {
      return `http://localhost:${serverInfo.port}${urlPath}`
    }
  }

  const close = browser.close
  browser.close = async () => {
    await close()

    if (serverInfo.server) {
      serverInfo.server.close()
    }
  }

  return browser
}
