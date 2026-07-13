export function joinPath(...parts: string[]): string {
  const segments = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part, index) => {
      const normalized = part.replace(/\\/g, '/')
      if (index === 0) return [normalized.replace(/\/+$/, '')]
      return [normalized.replace(/^\/+/, '').replace(/\/+$/, '')]
    })

  const joined = segments.join('/')
  if (/^[A-Za-z]:\//.test(joined) || joined.startsWith('//')) {
    return joined.replace(/\//g, '\\')
  }

  return joined
}

export function normalizeRootPath(path: string): string {
  return path.trim().replace(/[\\/]+$/, '')
}
