export interface PdfExportRequest {
  projectId: string
  destinationPath: string
  sectionIds: readonly string[]
}

export interface ExportResult {
  destinationPath: string
  bytesWritten: number
  generatedAt: string
}

export interface PdfExporter {
  export(request: PdfExportRequest): Promise<ExportResult>
}

export const pdfExporter: PdfExporter | null = null
