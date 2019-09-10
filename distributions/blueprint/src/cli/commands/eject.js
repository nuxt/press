import { join, dirname, relative } from 'path'
import consola from 'consola'
import { ensureDir, appendFile, readFile, writeFile } from 'fs-extra'

export async function ejectTemplates (nuxt, options, templates) {
  const { name, appDir } = options
  const resolvedAppDir = join(nuxt.options.srcDir, nuxt.options.dir.app, appDir || name)
  await ensureDir(resolvedAppDir)

  await Promise.all(templates.map(template => ejectTemplate(nuxt, options, template, resolvedAppDir)))
}

export async function ejectTemplate (nuxt, { name, appDir }, { src, dst }, resolvedAppDir) {
  if (!resolvedAppDir) {
    resolvedAppDir = join(nuxt.options.srcDir, nuxt.options.dir.app, appDir || name)
  }

  const dstFile = join(resolvedAppDir, dst)
  consola.debug(`Ejecting template '${src}' to '${dstFile}'`)

  const content = await readFile(src)
  if (!content) {
    consola.warn(`Reading source template file returned empty content, eject aborted for: ${relative(nuxt.options.srcDir, src)}`)
    return
  }

  await ensureDir(dirname(dstFile))

  await writeFile(dstFile, content)
  consola.info(`Ejected ${relative(nuxt.options.srcDir, dstFile)}`)
}

export async function ejectTheme (nuxt, options, discoveryPath) {
  // TODO: prevent appending the same theme.css more than once
  const content = await readFile(join(discoveryPath, 'theme.css'))
  if (!content) {
    consola.warn(`Reading from theme.css returned empty content, eject aborted`)
    return
  }

  const dstFile = join(nuxt.options.rootDir, 'nuxt.press.css')
  await appendFile(dstFile, content)

  consola.info(`Ejected to ./nuxt.press.css`)
}
