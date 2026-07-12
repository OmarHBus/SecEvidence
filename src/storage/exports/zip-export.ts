import type { ExportResult } from './pdf-export'

export interface ZipExportRequest {
  projectId: string
  destinationPath: string
  includeEvidenceFiles: boolean
}

export interface ZipExporter {
  export(request: ZipExportRequest): Promise<ExportResult>
}

export const zipExporter: ZipExporter | null = null
