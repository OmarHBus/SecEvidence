import type { Control, EvidenceItem, RiskItem } from '../../shared/types'

export const CSV_UTF8_BOM = '\uFEFF'

type CsvValue = string | number | boolean | null | undefined

/**
 * Escapes one value according to RFC 4180. Quotes are doubled and values that
 * contain a delimiter, quote, or line break are wrapped in double quotes.
 */
export function escapeCsvValue(value: CsvValue): string {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function buildCsv(headers: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ]

  return `${CSV_UTF8_BOM}${lines.join('\r\n')}\r\n`
}

function namesForControlIds(controlIds: readonly string[], controls: readonly Control[]): string {
  const controlsById = new Map(controls.map((control) => [control.id, control.name]))
  return controlIds
    .map((controlId) => controlsById.get(controlId))
    .filter((name): name is string => name !== undefined)
    .join('; ')
}

export function buildEvidenceCsv(
  evidenceItems: readonly EvidenceItem[],
  controls: readonly Control[],
): string {
  return buildCsv(
    [
      'evidence_id',
      'title',
      'category',
      'status',
      'linked_controls',
      'owner',
      'date',
      'file_name',
      'notes',
    ],
    evidenceItems.map((item) => [
      item.id,
      item.title,
      item.category,
      item.status,
      namesForControlIds(item.linkedControlIds, controls),
      item.owner,
      item.evidenceDate,
      item.fileName,
      item.notes,
    ]),
  )
}

export function buildControlsCsv(controls: readonly Control[]): string {
  return buildCsv(
    [
      'control_id',
      'name',
      'category',
      'status',
      'risk_level',
      'linked_evidence_count',
      'owner',
      'notes',
    ],
    controls.map((control) => [
      control.id,
      control.name,
      control.category,
      control.status,
      control.riskLevel,
      control.linkedEvidenceIds.length,
      control.owner,
      control.notes,
    ]),
  )
}

export function buildRisksCsv(risks: readonly RiskItem[], controls: readonly Control[]): string {
  const controlsById = new Map(controls.map((control) => [control.id, control.name]))

  return buildCsv(
    [
      'risk_id',
      'title',
      'severity',
      'status',
      'related_control',
      'recommendation',
      'description',
    ],
    risks.map((risk) => [
      risk.id,
      risk.title,
      risk.severity,
      risk.status,
      risk.relatedControlId ? controlsById.get(risk.relatedControlId) : undefined,
      risk.recommendation,
      risk.description,
    ]),
  )
}

export function downloadText(content: string, fileName: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType })
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

export function downloadCsv(csv: string, fileName: string): void {
  downloadText(csv, fileName, 'text/csv;charset=utf-8')
}
