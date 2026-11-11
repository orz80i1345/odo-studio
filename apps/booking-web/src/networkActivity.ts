let activeRequests = 0
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function beginNetworkActivity() {
  activeRequests += 1
  emitChange()

  let finished = false
  return () => {
    if (finished) return
    finished = true
    activeRequests = Math.max(0, activeRequests - 1)
    emitChange()
  }
}

export async function withNetworkActivity<T>(request: () => Promise<T>) {
  const finish = beginNetworkActivity()
  try {
    return await request()
  } finally {
    finish()
  }
}

export function subscribeToNetworkActivity(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getNetworkActivitySnapshot() {
  return activeRequests > 0
}
