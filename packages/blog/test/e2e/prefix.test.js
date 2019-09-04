import path from 'path'
import { getPort, startBrowser } from '@/utils'

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

  async function testPageHome () {
    expect(await page.getText('.blog h1')).toBe('Adding sidebar links')

    const expectedLinks = [ 'Home', 'Archive', 'About' ]
    const sidebarLinks = await page.getTexts('.sidebar .text-links a', true)
    expect(sidebarLinks).toEqual(expectedLinks)

    expect(await page.getText('.about p', true)).toEqual('A NuxtPress Blog')
  }

  async function testPageArchive () {
    expect(await page.getText('.blog h1')).toBe('2019')

    expect(await page.getElementCount('.blog .title a')).toBe(2)

    const expectedLinks = [
      '/my-blog/2019/jun/20/adding-sidebar-links/',
      '/my-blog/2019/apr/20/publishing-blogs/'
    ]
    expect(await page.getAttributes('.blog .title a', 'href')).toEqual(expectedLinks)
  }

  test('open home', async () => {
    const url = browser.getUrl('/my-blog')

    page = await browser.page(url)

    await testPageHome()
  })

  test('nav /archive', async () => {
    await page.navigate('/my-blog/archive')

    await testPageArchive()
  })

  test('open archive', async () => {
    const url = browser.getUrl('/my-blog/archive')

    page = await browser.page(url)

    await testPageArchive()
  })

  test('nav /', async () => {
    await page.navigate('/my-blog/')

    await testPageHome()
  })
})
