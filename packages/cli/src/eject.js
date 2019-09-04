import { join, dirname } from 'path'
import consola from 'consola'
import { ensureDir, appendFile, writeFile } from 'fs-extra'
import { readFileAsync } from '@nuxtpress/utils'

const cwd = process.cwd()

export async function ejectTemplate (blueprint, templatePath) {
  const blueprintsPath = join(dirname(require.resolve(`@nuxt/press`)), 'blueprints')

  await ensureDir(join(cwd, 'press', blueprint, dirname(templatePath)))

  await writeFile(
    join(cwd, 'press', blueprint, templatePath),
    await readFileAsync(join(blueprintsPath, blueprint, 'templates', templatePath), { encoding: 'utf8' })
  )

  consola.info(`Ejected ${join('press', blueprint, templatePath)}`)
}

export async function ejectTheme (filePath) {
  const blueprintsPath = join(dirname(require.resolve(`@nuxt/press`)), 'blueprints')

  await appendFile(
    join(cwd, 'nuxt.press.css'),
    await readFileAsync(join(blueprintsPath, filePath, 'theme.css'), { encoding: 'utf8' })
  )

  consola.info(`Ejected to ./nuxt.press.css`)
}
