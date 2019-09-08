import path from 'path'
import { exists, walk } from '@nuxt/blueprint'
import { getDirsAsArray } from './fs'

export async function createJobsFromConfig (nuxtOptions, config) {
  const srcRoots = getDirsAsArray(config.dir)

  for (const key in srcRoots) {
    if (!await exists(nuxtOptions.srcDir, srcRoots[key])) {
      // eslint-disable-next-line no-console
      console.warn(`Source Folder ${srcRoots[key]} doesnt exist, ignoring it`)
      srcRoots.splice(key, 1)
    }
  }

  if (!srcRoots.length) {
    srcRoots.push(nuxtOptions.srcDir)
  }

  let srcPrefixes = null
  if (typeof config.dir === 'object') {
    srcPrefixes = config.dir
  }

  const validate = (path) => {
    // ignore pages folder
    if (path.startsWith(nuxtOptions.dir.pages)) {
      return false
    }

    return path.endsWith('.md')
  }

  const jobs = []
  for (const srcRoot of srcRoots) {
    const srcPath = path.join(nuxtOptions.srcDir, srcRoot)
    const paths = await walk(srcPath, { validate })

    jobs.push(...paths.map((path) => {
      let prefix = ''
      if (srcPrefixes && srcPrefixes[srcRoot]) {
        prefix = srcPrefixes[srcRoot]
      }

      return {
        root: srcPath,
        prefix,
        path
      }
    }))
  }

  return jobs
}
