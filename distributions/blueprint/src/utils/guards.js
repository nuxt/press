export function abstractGuard (target, className) {
  if (target === className) {
    throw new Error(`${className} is an abstract class, do not instantiate it directly`)
  }
}

export function runOnceGuard (instance, name) {
  if (!instance._runGuards) {
    instance._runGuards = {}
  }

  if (instance._runGuards[name]) {
    return false
  }

  instance._runGuards[name] = true
  return true
}

export function runOnceGuardBlocking (instance, name) {
  if (!instance._runGuards) {
    instance._runGuards = {}
  }

  if (instance._runGuards[name] === true) {
    return false
  }

  if (instance._runGuards[name]) {
    return new Promise((resolve) => {
      instance._runGuards[name].push(() => resolve(false))
    })
  }

  instance._runGuards[name] = []

  return Promise.resolve(() => {
    instance._runGuards[name].forEach(r => r())
    instance._runGuards[name] = true
  })
}
