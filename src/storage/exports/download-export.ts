import { isDesktopApp } from '../files/tauri-env'

interface ExportFileFilter {
  name: string
  extensions: string[]
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function saveExportBlob(
  blob: Blob,
  fileName: string,
  filter: ExportFileFilter = { name: 'ZIP archive', extensions: ['zip'] },
): Promise<'saved' | 'downloaded' | 'cancelled'> {
  if (await isDesktopApp()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const destination = await save({
      defaultPath: fileName,
      filters: [filter],
    })

    if (!destination) return 'cancelled'

    await writeFile(destination, new Uint8Array(await blob.arrayBuffer()))
    return 'saved'
  }

  downloadBlob(blob, fileName)
  return 'downloaded'
}
