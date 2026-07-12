import type { EvidenceCategory } from '../../shared/types'

export const EVIDENCE_CATEGORY_FOLDERS: Record<EvidenceCategory, string> = {
  access_control: 'access-control',
  backups: 'backups',
  asset_inventory: 'assets',
  endpoint_security: 'endpoint-security',
  network_security: 'network-security',
  logging_monitoring: 'logs',
  incident_response: 'incident-response',
  supplier_management: 'suppliers',
  policies: 'policies',
  risk_management: 'other',
  training: 'other',
  other: 'other',
}

export const PACK_SUBFOLDERS = [
  'evidence/access-control',
  'evidence/backups',
  'evidence/assets',
  'evidence/endpoint-security',
  'evidence/network-security',
  'evidence/incident-response',
  'evidence/suppliers',
  'evidence/policies',
  'evidence/logs',
  'evidence/other',
  'exports',
  'metadata',
] as const

export interface SelectedEvidenceFile {
  fileName: string
  fileType: string
  fileSize: number
  sourcePath?: string
  browserFile?: File
}

export interface ProjectFolderInfo {
  rootFolder: string
  packFolderPath: string
  created: boolean
}
