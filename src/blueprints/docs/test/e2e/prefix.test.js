import path from 'path'
import { startBrowser } from '@/utils/browser'

describe('basic', () => {
  let browser
  let page

  beforeAll(async () => {
    const folder = path.resolve(__dirname, '..', 'fixtures/prefix/dist/')

    browser = await startBrowser(folder)

    // browser.setLogLevel(['log', 'info', 'warn', 'error'])
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