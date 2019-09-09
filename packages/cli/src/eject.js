import { join, dirname } from 'path'
import consola from 'consola'
import { ensureDir, appendFile, writeFile } from 'fs-extra'
import { readTextFile } from '@nuxt-press/utils'

const cwd = process.cwd()

export async function ejectTemplate (blueprint, templatePath) {
  const blueprintsPath = join(dirname(require.resolve(`@nuxt/press`)), 'blueprints')

  await ensureDir(join(cwd, 'press', blueprint, dirname(templatePath)))

  await writeFile(
    join(cwd, 'press', blueprint, templatePath),
    await readTextFile(blueprintsPath, blueprint, 'templates', templatePath)
  )

  consola.info(`Ejected ${join('press', blueprint, templatePath)}`)
}

export async function ejectTheme (filePath) {
  const blueprintsPath = join(dirname(require.resolve(`@nuxt/press`)), 'blueprints')

  await appendFile(
    join(cwd, 'nuxt.press.css'),
    await readTextFile(blueprintsPath, filePath, 'theme.css')
  )

  consola.info(`Ejected to ./nuxt.press.css`)
}
