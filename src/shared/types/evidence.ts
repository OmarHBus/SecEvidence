export type EvidenceCategory =
  | 'access_control'
  | 'backups'
  | 'asset_inventory'
  | 'endpoint_security'
  | 'network_security'
  | 'logging_monitoring'
  | 'incident_response'
  | 'supplier_management'
  | 'policies'
  | 'risk_management'
  | 'training'
  | 'other'

export type EvidenceStatus = 'accepted' | 'needs_review' | 'missing' | 'outdated'

export interface EvidenceItem {
  id: string
  projectId: string
  title: string
  description?: string
  category: EvidenceCategory
  status: EvidenceStatus
  linkedControlIds: string[]
  owner?: string
  evidenceDate?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  localPath?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
