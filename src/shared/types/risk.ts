export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RiskStatus = 'open' | 'in_progress' | 'accepted' | 'closed'

export interface RiskItem {
  id: string
  projectId: string
  title: string
  description: string
  severity: RiskSeverity
  relatedControlId?: string
  recommendation?: string
  status: RiskStatus
  createdAt: string
}
