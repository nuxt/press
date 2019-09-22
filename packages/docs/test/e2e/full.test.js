import path from 'path'
import { getPort, startBrowser } from 'test-utils'

describe('full', () => {
  let browser
  let page

  beforeAll(async () => {
    const folder = path.resolve(__dirname, '..', 'fixtures/full/dist/')
    const port = await getPort()

    browser = await startBrowser({ folder, port })

    // pass through browser errors, only works with chrome/puppeteer
    browser.setLogLevel(['log', 'info', 'warn', 'error'])
  })

  afterAll(() => browser.close())

  async function testPageHome () {
    expect(await page.getText('h1')).toBe('Full Nuxt Press Docs Test')
  }

  async function testPageDocsNL () {
    expect(await page.getText('h1')).toBe('Hallo Wereld')

    const expectedLinks = [ 'Hallo Wereld' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageDocsEN () {
    expect(await page.getText('h1')).toBe('Hello World')

    const expectedLinks = [ 'Hello World' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageGuideDocsNL () {
    expect(await page.getText('h1')).toBe('Gids')

    const expectedLinks = [ 'Gids' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testPageGuideDocsEN () {
    expect(await page.getText('h1')).toBe('Guide')

    const expectedLinks = [ 'Guide' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  test('open home', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)

    await testPageHome()
  })

  test('nav /docs', async () => {
    await page.navigate('/docs/')

    await testPageDocsEN()
  })

  test('open /docs', async () => {
    const url = browser.getUrl('/docs')

    page = await browser.page(url)

    await testPageDocsEN()
  })

  test('nav /docs/nl', async () => {
    await page.navigate('/docs/nl/')

    await testPageDocsNL()
  })

  test('open /docs/nl', async () => {
    const url = browser.getUrl('/docs/nl')

    page = await browser.page(url)

    await testPageDocsNL()
  })

  test('nav /docs/en', async () => {
    await page.navigate('/docs/en/')

    await testPageDocsEN()
  })

  test('open /docs/en', async () => {
    const url = browser.getUrl('/docs/en')
    page = await browser.page(url)

    await testPageDocsEN()
  })

  test('nav /guide-docs', async () => {
    await page.navigate('/guide-docs/')

    await testPageGuideDocsEN()
  })

  test('open /guide-docs', async () => {
    const url = browser.getUrl('/guide-docs')

    page = await browser.page(url)

    await testPageGuideDocsEN()
  })

  test('nav /guide-docs/nl', async () => {
    await page.navigate('/guide-docs/nl/')

    await testPageGuideDocsNL()
  })

  test('open /guide-docs/nl', async () => {
    const url = browser.getUrl('/guide-docs/nl')

    page = await browser.page(url)

    await testPageGuideDocsNL()
  })

  test('nav /guide-docs/en', async () => {
    await page.navigate('/guide-docs/en/')

    await testPageGuideDocsEN()
  })

  test('open /guide-docs/en', async () => {
    const url = browser.getUrl('/guide-docs/en')
    page = await browser.page(url)

    await testPageGuideDocsEN()
  })

  test('nav /', async () => {
    await page.navigate('/')

    await testPageHome()
  })
})
