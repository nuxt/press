import { resolve as _resolve } from 'path'
import { join } from './utils'

export default function resolve (...paths) {
  return _resolve(__dirname, join(...paths))
}
