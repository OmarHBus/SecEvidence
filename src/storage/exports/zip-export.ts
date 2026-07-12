import JSZip from 'jszip'
import type { AppSettings, Control, EvidenceItem, Project, RiskItem } from '../../shared/types'
import type { AppDataStats } from '../../app/state/app-data-context'
import { buildZipExportName } from '../../shared/utils/file-names'
import {
  buildControlsCsv,
  buildEvidenceCsv,
  buildRisksCsv,
} from './csv-export'
import { buildMarkdownReport } from './markdown-report'
import { EVIDENCE_CATEGORY_FOLDERS } from '../files/file-types'
import { readEvidenceFileBytes } from '../files/evidence-file-store'

export interface ZipExportInput {
  project: Project
  evidenceItems: readonly EvidenceItem[]
  controls: readonly Control[]
  risks: readonly RiskItem[]
  stats: AppDataStats
  settings: AppSettings
  includeEvidenceFiles?: boolean
}

export interface ZipExportResult {
  blob: Blob
  fileName: string
  includedEvidenceFiles: number
  skippedEvidenceFiles: number
}

export async function buildEvidencePackZip({
  project,
  evidenceItems,
  controls,
  risks,
  stats,
  settings,
  includeEvidenceFiles = true,
}: ZipExportInput): Promise<ZipExportResult> {
  const zip = new JSZip()
  const report = buildMarkdownReport({
    project,
    evidenceItems,
    controls,
    risks,
    stats,
    settings,
  })

  zip.file('report.md', report)
  zip.file('evidence-index.csv', buildEvidenceCsv(evidenceItems, controls))
  zip.file('controls.csv', buildControlsCsv(controls))
  zip.file('risks.csv', buildRisksCsv(risks, controls))

  let includedEvidenceFiles = 0
  let skippedEvidenceFiles = 0

  if (includeEvidenceFiles) {
    for (const item of evidenceItems) {
      if (!item.localPath || !item.fileName) {
        skippedEvidenceFiles += 1
        continue
      }

      const bytes = await readEvidenceFileBytes(item.localPath)
      if (!bytes) {
        skippedEvidenceFiles += 1
        continue
      }

      const folder = EVIDENCE_CATEGORY_FOLDERS[item.category]
      zip.file(`evidence/${folder}/${item.fileName}`, bytes)
      includedEvidenceFiles += 1
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return {
    blob,
    fileName: buildZipExportName(project.clientName),
    includedEvidenceFiles,
    skippedEvidenceFiles,
  }
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

export async function exportEvidencePackZip(input: ZipExportInput): Promise<ZipExportResult> {
  const result = await buildEvidencePackZip(input)
  downloadBlob(result.blob, result.fileName)
  return result
}
