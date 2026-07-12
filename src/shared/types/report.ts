export type ReportStatus = 'draft' | 'ready' | 'generated'

export interface ReportSection {
  id: string
  title: string
  description: string
  included: boolean
}

export interface Report {
  id: string
  projectId: string
  title: string
  status: ReportStatus
  format: 'PDF'
  sections: ReportSection[]
  updatedAt: string
}
