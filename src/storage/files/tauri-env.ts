export async function isDesktopApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const { isTauri } = await import('@tauri-apps/api/core')
    return isTauri()
  } catch {
    return false
  }
}
