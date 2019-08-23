import os from 'os'
import consola from 'consola'
import { waitFor } from '@nuxt/utils'

const failureInterval = 3000
const maxRetries = 0 // use 0 for debugging
const pool = new Array(os.cpus().length).fill(null)

export default class PromisePool {
  constructor (jobs, handler) {
    this.handler = handler
    this.jobs = jobs.map(payload => ({ payload }))
  }

  async done (before) {
    if (before) {
      await before()
    }

    await Promise.all(pool.map(() => {
      return new Promise(async (resolve) => {
        while (this.jobs.length) {
          let job
          try {
            job = this.jobs.pop()
            await this.handler(job.payload)
          } catch (err) {
            if (job.retries && job.retries === maxRetries) {
              consola.warn('Job exceeded retry limit: ', job)
              break
            }

            if (maxRetries > 0) {
              job.retries = job.retries ? job.retries + 1 : 1

              await waitFor(failureInterval)
              this.jobs.unshift(job)

              consola.warn('Requeued job due to failure: ', job, err)
              break
            }

            consola.warn('Job failed: ', job, err)
          }
        }
        resolve()
      })
    }))
  }
}
