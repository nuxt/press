import path from 'path'
import { getPort, startBrowser } from '@/utils'

describe.skip('basic', () => {
  let browser
  let page

  beforeAll(async () => {
    const folder = path.resolve(__dirname, '..', 'fixtures/prefix/dist/')
    const port = await getPort()

    browser = await startBrowser({ folder, port })

    // pass through browser errors, only works with chrome/puppeteer
    browser.setLogLevel(['log', 'info', 'warn', 'error'])
  })

  afterAll(() => browser.close())

  test('open home', async () => {
    const url = browser.getUrl('/custom')

    page = await browser.page(url)
  })

  test('test home', async () => {
    expect(await page.getText('h1')).toBe('Custom Prefix')
  })
})
