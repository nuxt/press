import path from 'path'
import { loadFixture, Nuxt, Builder, BundleBuilder, Generator, listPaths } from './index'

export function buildFixture ({ dir, callback, hooks = [], changedPaths = [] }) {
  const pathsBefore = {}
  let nuxt

  const fixture = path.basename(dir)

  test(`Build ${fixture}`, async () => {
    const config = await loadFixture(dir)
    nuxt = new Nuxt(config)

    pathsBefore.root = await listPaths(nuxt.options.rootDir)
    if (nuxt.options.rootDir !== nuxt.options.srcDir) {
      pathsBefore.src = await listPaths(nuxt.options.srcDir)
    }

    const buildDone = jest.fn()
    hooks.forEach(([hook, fn]) => nuxt.hook(hook, fn))
    nuxt.hook('build:done', buildDone)

    const builder = await new Builder(nuxt, BundleBuilder)
    const generator = new Generator(nuxt, builder)

    await generator.generate({ init: true, build: true })

    // 2: BUILD_DONE
    expect(builder._buildStatus).toBe(2)
    expect(buildDone).toHaveBeenCalledTimes(1)

    if (typeof callback === 'function') {
      callback(builder)
    }
  }, 120000)

  test('Check changed files', async () => {
    expect.hasAssertions()

    const allowedPaths = [
      nuxt.options.buildDir,
      nuxt.options.generate.dir,
      `${nuxt.options.srcDir}$`,
      `${nuxt.options.srcDir}/nuxt.press.json$`,
      ...changedPaths.map(p => path.isAbsolute(p) ? p : path.join(nuxt.options.srcDir, p))
    ]

    const allowedPathsRE = new RegExp(`^(${allowedPaths.join('|')})`)

    // When building Nuxt we only expect files to changed
    // within the nuxt.options.buildDir
    for (const key in pathsBefore) {
      const paths = await listPaths(nuxt.options[`${key}Dir`], pathsBefore[key])

      for (const item of paths) {
        expect(item.path).toEqual(expect.stringMatching(allowedPathsRE))
      }
    }
  })
}
