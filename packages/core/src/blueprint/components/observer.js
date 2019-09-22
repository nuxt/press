export class EntriesObserver {
  static getEntryId (entry) {
    return `${entry.target.tagName}${entry.target.id}`
  }

  constructor ({ initialId, callback, throttle = 0 }) {
    this.initialId = initialId
    this.throttle = throttle
    this.callback = callback
  }

  update (entries, initial) {
    if (this.entries === undefined && initial === undefined) {
      initial = true
      this.entries = []
    }

    for (const entry of entries) {
      entry.$id = this.constructor.getEntryId(entry)

      if (initial) {
        this.entries.push(entry)
        continue
      }

      const oldEntryIndex = this.entries.findIndex(e => e.$id === entry.$id)
      this.entries.splice(oldEntryIndex, 1, entry)
    }

    this.callActive(initial)
  }

  callActive (initial) {
    let entry

    if (initial) {
      entry = this.entries.find(e => e.target.id === this.initialId)
    } else {
      entry = this.entries.find(e => e.intersectionRatio > 0)
    }

    if (entry && this.callback) {
      if (!this.throttle) {
        this.callback(entry.target)
        return
      }

      clearTimeout(this.timeout)

      this.timeout = setTimeout(() => this.callback(entry.target), this.throttle)
    }
  }
}

export function startObserver ({ vm, elements, initialId, throttle = 100, options = {} }, callback) {
  if (!elements) {
    return null
  }

  const ahObserver = new EntriesObserver({
    initialId,
    throttle,
    callback
  })

  const observer = new IntersectionObserver(entries => ahObserver.update(entries), options)

  if (typeof elements === 'string') {
    elements = [...document.querySelectorAll(elements)]
  }

  elements.forEach(e => observer.observe(e))

  if (vm) {
    if (!Array.isArray(vm.$options.destroyed)) {
      vm.$options.destroyed = []
    }

    vm.$options.destroyed.push(() => observer.disconnect())
  }

  return observer
}
