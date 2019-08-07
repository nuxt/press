import path from 'path'
import { getPort, startBrowser } from '@/utils'

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

  test('open home', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)
  })

  test('test home', async () => {
    expect(await page.getAttribute('.hero img', 'src')).toBe('/hero.png')
    expect(await page.getElementCount('.feature')).toBe(3)
    expect(await page.getText('h1')).toBe('Lorem Ipsum')

    const expectedLinks = [ 'A test', 'B test', 'C test', 'GitHub' ]
    const navLinks = await page.getTexts('.top-menu .links .nav-item a.nav-link', true)
    expect(navLinks).toEqual(expectedLinks)
  })

  test('nav /a', async () => {
    await page.navigate('/a')

    await testPageA()
  })

  test('nav /a/first (depth visibility)', async () => {
    expect(await page.getText('.sidebar-depth-1 .sidebar-links:not([hidden]) .sidebar-link')).toBeNull()

    await page.navigate('/a/first/')

    expect(await page.getText('.sidebar-depth-1 .sidebar-links:not([hidden]) .sidebar-link', true)).toEqual('First Header 2')
  })

  test('nav /a/second (depth visibility)', async () => {
    expect(await page.getText('.sidebar-depth-1 .sidebar-section:nth-child(3) .sidebar-links:not([hidden]) .sidebar-link')).toBeNull()

    await page.navigate('/a/second/')

    expect(await page.getText('.sidebar-depth-1 .sidebar-section:nth-child(3) .sidebar-links:not([hidden]) .sidebar-link', true)).toEqual('Second Header 1.1')
  })

  test('open /a', async () => {
    const url = browser.getUrl('/a/')

    page = await browser.page(url)

    await testPageA()
  })

  test('nav /b', async () => {
    await page.navigate('/b/')

    await testPageB()
  })

  test('open /b', async () => {
    const url = browser.getUrl('/b/')

    page = await browser.page(url)

    await testPageB()
  })

  test('nav /c', async () => {
    await page.navigate('/c/')

    await testPageC()
  })

  test('open /c', async () => {
    const url = browser.getUrl('/c/')
    page = await browser.page(url)

    await testPageC()
  })
})
