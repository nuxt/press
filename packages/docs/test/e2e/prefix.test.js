import path from 'path'
import { getPort, startBrowser } from 'test-utils'

describe('prefix', () => {
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

  async function testPageA () {
    expect(await page.getText('.docs h1')).toBe('Header')

    const expectedLinks = [ 'Home', 'Header', 'First Header 1', 'First Header 2', 'Second Header 1', 'Second Header 1.1' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)

    expect(await page.getText('.sidebar-heading span')).toBe('A test')

    expect(await page.getElementCount('.sidebar-links[hidden]')).toBe(2)
  }

  async function testPageB () {
    expect(await page.getText('.docs h1')).toBe('B1')

    const expectedLinks = [ 'B1', 'B2', 'B2.1', 'B2.1.1', 'B2.2', 'B3' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)

    expect(await page.getElementCount('.sidebar-links[hidden]')).toBe(0)
  }

  async function testPageC () {
    expect(await page.getText('.docs h1')).toBe('C1')

    const expectedLinks = [ 'C1 Meta', 'C1.1', 'C1.1.1', 'C1.1.1.1', 'Second Header 1', 'Second Header 1.1' ]
    const sidebarLinks = await page.getTexts('.sidebar-link', true)
    expect(sidebarLinks).toEqual(expectedLinks)
  }

  async function testHome () {
    expect(await page.getAttribute('.hero img', 'src')).toBe('/hero.png')
    expect(await page.getElementCount('.feature')).toBe(3)
    expect(await page.getText('.home div h1')).toBe('Custom Prefix')

    const expectedLinks = [ 'A test', 'B test', 'C test', 'GitHub' ]
    const navLinks = await page.getTexts('.top-menu .links .nav-item a.nav-link', true)
    expect(navLinks).toEqual(expectedLinks)
  }

  test('open root', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)

    expect(await page.getHtml()).toEqual(expect.stringMatching(/error/i))
  })

  test('open home', async () => {
    const url = browser.getUrl('/custom/')

    page = await browser.page(url)

    await testHome()
  })

  test('nav /custom/a', async () => {
    await page.navigate('/custom/a')

    await testPageA()
  })

  test('nav /custom/a/first (depth visibility)', async () => {
    expect(await page.getText('.sidebar-depth-1 .sidebar-links:not([hidden]) .sidebar-link')).toBeNull()

    await page.navigate('/custom/a/first/')

    expect(await page.getText('.sidebar-depth-1 .sidebar-links:not([hidden]) .sidebar-link', true)).toEqual('First Header 2')
  })

  test('nav /custom/a/second (depth visibility)', async () => {
    expect(await page.getText('.sidebar-depth-1 .sidebar-section:nth-child(3) .sidebar-links:not([hidden]) .sidebar-link')).toBeNull()

    await page.navigate('/custom/a/second/')

    expect(await page.getText('.sidebar-depth-1 .sidebar-section:nth-child(3) .sidebar-links:not([hidden]) .sidebar-link', true)).toEqual('Second Header 1.1')
  })

  test('open /custom/a', async () => {
    const url = browser.getUrl('/custom/a/')

    page = await browser.page(url)

    await testPageA()
  })

  test('nav /custom/b', async () => {
    await page.navigate('/custom/b/')

    await testPageB()
  })

  test('open /custom/b', async () => {
    const url = browser.getUrl('/custom/b/')

    page = await browser.page(url)

    await testPageB()
  })

  test('nav /custom/c', async () => {
    await page.navigate('/custom/c/')

    await testPageC()
  })

  test('open /custom/c', async () => {
    const url = browser.getUrl('/custom/c/')
    page = await browser.page(url)

    await testPageC()
  })

  test('nav /custom', async () => {
    await page.navigate('/custom')

    await testHome()
  })
})
