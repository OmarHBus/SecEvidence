export interface Project {
  id: string
  clientName: string
  projectName: string
  packType: string
  description?: string
  deadline?: string
  localPackPath?: string
  createdAt: string
  updatedAt: string
  readinessPercent: number
  evidenceCount: number
  controlsCovered: number
  controlsTotal: number
  openGaps: number
  highRiskGaps: number
}
