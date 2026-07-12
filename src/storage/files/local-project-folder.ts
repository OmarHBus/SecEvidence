import { buildProjectPackFolderName } from '../../shared/utils/file-names'
import { PACK_SUBFOLDERS, type ProjectFolderInfo } from './file-types'
import { isDesktopApp } from './tauri-env'

export async function selectFolder(title?: string): Promise<string | null> {
  if (!(await isDesktopApp())) return null

  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    directory: true,
    multiple: false,
    title: title ?? 'Select folder',
  })

  return typeof selected === 'string' ? selected : null
}

export async function openPath(path: string): Promise<boolean> {
  if (!path || !(await isDesktopApp())) return false

  try {
    const { openPath: openTarget } = await import('@tauri-apps/plugin-opener')
    await openTarget(path)
    return true
  } catch {
    return false
  }
}

export async function revealPath(path: string): Promise<boolean> {
  if (!path || !(await isDesktopApp())) return false

  try {
    const { revealItemInDir } = await import('@tauri-apps/plugin-opener')
    await revealItemInDir(path)
    return true
  } catch {
    return openPath(path)
  }
}

export async function ensureProjectPackFolder(
  rootFolder: string,
  clientName: string,
): Promise<ProjectFolderInfo> {
  const packFolderPath = `${normalizePath(rootFolder)}/${buildProjectPackFolderName(clientName)}`

  if (!(await isDesktopApp())) {
    return { rootFolder, packFolderPath, created: false }
  }

  const { mkdir, exists } = await import('@tauri-apps/plugin-fs')
  let created = false

  if (!(await exists(packFolderPath))) {
    await mkdir(packFolderPath, { recursive: true })
    created = true
  }

  for (const subfolder of PACK_SUBFOLDERS) {
    const folderPath = `${packFolderPath}/${subfolder}`
    if (!(await exists(folderPath))) {
      await mkdir(folderPath, { recursive: true })
      created = true
    }
  }

  return { rootFolder, packFolderPath, created }
}

function normalizePath(path: string): string {
  return path.replace(/[\\/]+$/, '')
}
