import type { EvidenceCategory } from '../../shared/types'
import { sanitizeFileNamePart } from '../../shared/utils/file-names'
import { EVIDENCE_CATEGORY_FOLDERS, type SelectedEvidenceFile } from './file-types'
import { isDesktopApp } from './tauri-env'

function inferFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return 'File'
  return extension.toUpperCase()
}

function fileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.split('/').pop() ?? path
}

export async function selectEvidenceFile(): Promise<SelectedEvidenceFile | null> {
  if (await isDesktopApp()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ multiple: false, directory: false })
    if (typeof selected !== 'string') return null

    const { stat } = await import('@tauri-apps/plugin-fs')
    const fileName = fileNameFromPath(selected)
    const fileStat = await stat(selected)

    return {
      fileName,
      fileType: inferFileType(fileName),
      fileSize: fileStat.size,
      sourcePath: selected,
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) {
        resolve(null)
        return
      }

      resolve({
        fileName: file.name,
        fileType: inferFileType(file.name),
        fileSize: file.size,
        browserFile: file,
      })
    })

    input.addEventListener('cancel', () => {
      input.remove()
      resolve(null)
    })

    document.body.append(input)
    input.click()
  })
}

export async function copyEvidenceFileToPack(
  packFolderPath: string,
  category: EvidenceCategory,
  sourcePath: string,
  fileName: string,
): Promise<string | null> {
  if (!(await isDesktopApp())) return null

  const { copyFile, exists, mkdir } = await import('@tauri-apps/plugin-fs')
  const categoryFolder = EVIDENCE_CATEGORY_FOLDERS[category]
  const evidenceDir = `${packFolderPath}/evidence/${categoryFolder}`

  if (!(await exists(evidenceDir))) {
    await mkdir(evidenceDir, { recursive: true })
  }

  const safeName = sanitizeFileNamePart(fileName) || 'evidence-file'
  let destinationPath = `${evidenceDir}/${safeName}`

  if (await exists(destinationPath)) {
    const dotIndex = safeName.lastIndexOf('.')
    const stem = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName
    const extension = dotIndex > 0 ? safeName.slice(dotIndex) : ''
    destinationPath = `${evidenceDir}/${stem}-${Date.now()}${extension}`
  }

  await copyFile(sourcePath, destinationPath)
  return destinationPath
}

export async function readEvidenceFileBytes(localPath: string): Promise<Uint8Array | null> {
  if (!(await isDesktopApp()) || !localPath) return null

  try {
    const { readFile } = await import('@tauri-apps/plugin-fs')
    return await readFile(localPath)
  } catch {
    return null
  }
}

export { revealPath as revealEvidenceFile, openPath as openEvidenceFolder } from './local-project-folder'
