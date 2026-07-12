import type { EvidenceCategory, EvidenceStatus } from '../types'

export const categoryLabels: Record<EvidenceCategory, string> = {
  access_control: 'Access Control',
  backups: 'Backups',
  asset_inventory: 'Assets',
  endpoint_security: 'Endpoint Security',
  network_security: 'Network Security',
  logging_monitoring: 'Logging & Monitoring',
  incident_response: 'Incident Response',
  supplier_management: 'Suppliers',
  policies: 'Policies',
  risk_management: 'Risk Management',
  training: 'Training',
  other: 'Other',
}

export const statusLabels: Record<EvidenceStatus, string> = {
  accepted: 'Accepted',
  needs_review: 'Needs review',
  missing: 'Missing',
  outdated: 'Outdated',
}

export const formatDate = (value?: string): string => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
