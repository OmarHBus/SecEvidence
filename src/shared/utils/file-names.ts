export function sanitizeFileNamePart(value: string): string {
  return [...value]
    .map((character) => (
      character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? '-' : character
    ))
    .join('')
    .trim()
}

export function buildProjectPackFolderName(clientName: string): string {
  const safeClient = sanitizeFileNamePart(clientName).replaceAll(' ', '_') || 'client'
  return `${safeClient}_security_evidence_pack`
}

export function buildZipExportName(clientName: string, date = new Date()): string {
  const safeClient = sanitizeFileNamePart(clientName).replaceAll(' ', '_') || 'client'
  const isoDate = date.toISOString().slice(0, 10)
  return `${safeClient}_security_evidence_pack_${isoDate}.zip`
}
