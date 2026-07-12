export const LOCAL_STORE_KEYS = {
  projects: 'secevidence.projects',
  evidence: 'secevidence.evidence',
  controls: 'secevidence.controls',
  risks: 'secevidence.risks',
  activeProjectId: 'secevidence.activeProjectId',
  settings: 'secevidence.settings',
} as const

const memoryStore = new Map<string, string>()

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

function readRaw(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? memoryStore.get(key) ?? null
  } catch {
    return memoryStore.get(key) ?? null
  }
}

function writeRaw(key: string, value: string): void {
  memoryStore.set(key, value)

  try {
    getStorage()?.setItem(key, value)
  } catch {
    // The in-memory copy keeps the app usable when storage is unavailable.
  }
}

export const localStore = {
  get<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
    const raw = readRaw(key)
    if (raw === null) {
      const initialValue = clone(fallback)
      writeRaw(key, JSON.stringify(initialValue))
      return initialValue
    }

    try {
      const parsed: unknown = JSON.parse(raw)
      if (isValid && !isValid(parsed)) throw new Error(`Invalid local data for ${key}`)
      return clone(parsed as T)
    } catch {
      const restoredValue = clone(fallback)
      writeRaw(key, JSON.stringify(restoredValue))
      return restoredValue
    }
  },

  set<T>(key: string, value: T): T {
    const nextValue = clone(value)
    writeRaw(key, JSON.stringify(nextValue))
    return nextValue
  },

  remove(key: string): void {
    memoryStore.delete(key)
    try {
      getStorage()?.removeItem(key)
    } catch {
      // Removing an unavailable storage entry is intentionally a no-op.
    }
  },
}

export function createLocalId(prefix = 'local'): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') {
    return `${prefix}-${cryptoApi.randomUUID()}`
  }

  const randomPart = Math.random().toString(36).slice(2)
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`
}
