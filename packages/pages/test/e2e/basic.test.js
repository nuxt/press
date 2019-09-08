import path from 'path'
import { getPort, startBrowser } from 'test-utils'

describe('basic', () => {
  let browser
  let page

  beforeAll(async () => {
    const folder = path.resolve(__dirname, '..', 'fixtures/basic/dist/')
    const port = await getPort()

    browser = await startBrowser({ folder, port })

    // pass through browser errors, only works with chrome/puppeteer
    browser.setLogLevel(['log', 'info', 'warn', 'error'])
  })

  afterAll(() => browser.close())

  async function testHome () {
    expect(await page.getText('h1')).toBe('Index')
    expect(await page.getText('main p')).toBe('Lorem ipsum')
  }

  async function testPageContact () {
    expect(await page.getText('h1')).toBe('Contact you')
    expect(await page.getText('main p')).toBe('Contact me')
  }

  async function testPageAbout () {
    expect(await page.getText('h1')).toBe('About')
    expect(await page.getText('main p')).toBe('Well, ok then.')
  }

  test('open home', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)

    await testHome()
  })

  test('nav /contact/', async () => {
    await page.navigate('/contact/')

    await testPageContact()
  })

  test('open contact', async () => {
    const url = browser.getUrl('/contact')

    page = await browser.page(url)

    await testPageContact()
  })

  test('nav /about/', async () => {
    await page.navigate('/about/')

    await testPageAbout()
  })

  test('open about', async () => {
    const url = browser.getUrl('/about')

    page = await browser.page(url)

    await testPageAbout()
  })

  test('nav /', async () => {
    await page.navigate('/')

    await testHome()
  })
})
