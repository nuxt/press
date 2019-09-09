import { autoregister as _autoregister } from '@nuxt-press/core'
import Blueprint from './blueprint'

export { Blueprint }

export function autoregister (options) {
  return _autoregister.call(this, options, [Blueprint.id])
}
