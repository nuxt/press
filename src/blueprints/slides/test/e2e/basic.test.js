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

  async function testHome () {
    expect(await page.getElementCount('li a')).toBe(1)
    expect(await page.getText('li a')).toBe('/presentation/')
  }

  async function testPagePresentation () {
    expect(await page.getElementCount('.slides .swiper-slide')).toBe(3)

    expect(await page.getText('.slides .slide-1 p')).toBe(`A
Presentation`)

    expect(await page.getText('.slides .slide-2 h1')).toBe('Slide 1')
    expect(await page.getText('.slides .slide-2 p')).toBe('Text 1')

    expect(await page.getText('.slides .slide-3 h1')).toBe('Slide 2')
    expect(await page.getText('.slides .slide-3 p')).toBe('Text 2')
  }

  test('open home', async () => {
    const url = browser.getUrl('/')

    page = await browser.page(url)

    await testHome()
  })

  test('nav /presentation/', async () => {
    await page.navigate('/presentation/')

    await testPagePresentation()
  })

  test('open home', async () => {
    const url = browser.getUrl('/presentation')

    page = await browser.page(url)

    await testPagePresentation()
  })

  test('nav /', async () => {
    await page.navigate('/')

    await testHome()
  })
})
