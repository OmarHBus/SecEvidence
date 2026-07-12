import type { ExportResult } from './pdf-export'

export type CsvDataset = 'evidence' | 'controls' | 'risks'

export interface CsvExportRequest {
  projectId: string
  destinationPath: string
  dataset: CsvDataset
}

export interface CsvExporter {
  export(request: CsvExportRequest): Promise<ExportResult>
}

export const csvExporter: CsvExporter | null = null
