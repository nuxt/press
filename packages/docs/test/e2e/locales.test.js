import path from 'path'
import { getPort, startBrowser } from 'test-utils'

describe('locales', () => {
  let browser
  let page

  beforeAll(async () => {
    const folder = path.resolve(__dirname, '..', 'fixtures/locales/dist/')
    const port = await getPort()

    browser = await startBrowser({ folder, port })

    // pass through browser errors, only works with chrome/puppeteer
    browser.setLogLevel(['log', 'info', 'warn', 'error'])
  })

  afterAll(() => browser.close())

  async function testPageHomeEN () {
    expect(await page.getText('h1')).toBe('Hello World')

    const expectedLinks = [ 'Hello World', 'Guide' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageHomeNL () {
    expect(await page.getText('h1')).toBe('Hallo Wereld')

    const expectedLinks = [ 'Hallo Wereld', 'Gids' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageGuideEN () {
    expect(await page.getText('h1')).toBe('Guide')

    const expectedLinks = [ 'Guide' ]
    const sidebarLinks = await page.getTexts('.sidebar-link.active', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageGuideNL () {
    expect(await page.getText('h1')).toBe('Gids')

    const expectedLinks = [ 'Gids' ]
    const sidebarLinks = await page.getTexts('.sidebar-link.active', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  test('open home', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)

    await testPageHomeEN()
  })

  test('nav /nl', async () => {
    await page.navigate('/nl/')

    await testPageHomeNL()
  })

  test('open /nl', async () => {
    const url = browser.getUrl('/nl')

    page = await browser.page(url)

    await testPageHomeNL()
  })

  test('nav /nl/guide', async () => {
    await page.navigate('/nl/guide/')

    await testPageGuideNL()
  })

  test('open /nl/guide', async () => {
    const url = browser.getUrl('/nl/guide')

    page = await browser.page(url)

    await testPageGuideNL()
  })

  test('nav /en', async () => {
    await page.navigate('/en/')

    await testPageHomeEN()
  })

  test('open /en', async () => {
    const url = browser.getUrl('/en')
    page = await browser.page(url)

    await testPageHomeEN()
  })

  test('nav /en/guide', async () => {
    await page.navigate('/en/guide/')

    await testPageGuideEN()
  })
})
