import type { EvidenceCategory } from './evidence'
import type { RiskSeverity } from './risk'

export type ControlStatus = 'covered' | 'gap' | 'in_progress' | 'not_applicable'

export interface Control {
  id: string
  projectId: string
  name: string
  description?: string
  category: EvidenceCategory
  status: ControlStatus
  riskLevel: RiskSeverity
  linkedEvidenceIds: string[]
  owner?: string
  notes?: string
}
