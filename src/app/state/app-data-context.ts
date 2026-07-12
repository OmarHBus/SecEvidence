import { createContext } from 'react'
import type { AppSettings, Control, EvidenceItem, Project, RiskItem } from '../../shared/types'
import type { CreateControlInput, UpdateControlInput } from '../../storage/local/controls-repository'
import type { CreateEvidenceInput, UpdateEvidenceInput } from '../../storage/local/evidence-repository'
import type { CreateProjectInput, UpdateProjectInput } from '../../storage/local/project-repository'
import type { CreateRiskInput, UpdateRiskInput } from '../../storage/local/risks-repository'

export interface AppDataStats {
  totalEvidence: number
  controlsTotal: number
  controlsCovered: number
  controlsInProgress: number
  controlsWithGaps: number
  applicableControls: number
  openGaps: number
  highCriticalGaps: number
  pendingReviewEvidence: number
  outdatedEvidence: number
  readinessPercent: number
}

export interface AppDataContextValue {
  activeProjectId: string | null
  activeProject: Project | undefined
  projects: Project[]
  evidenceItems: EvidenceItem[]
  controls: Control[]
  risks: RiskItem[]
  settings: AppSettings
  stats: AppDataStats
  selectProject: (projectId: string) => boolean
  createProject: (input: CreateProjectInput) => Project
  updateProject: (id: string, input: UpdateProjectInput) => Project | undefined
  deleteProject: (id: string) => boolean
  createEvidence: (input: CreateEvidenceInput) => EvidenceItem
  updateEvidence: (id: string, input: UpdateEvidenceInput) => EvidenceItem | undefined
  deleteEvidence: (id: string) => boolean
  createControl: (input: CreateControlInput) => Control
  updateControl: (id: string, input: UpdateControlInput) => Control | undefined
  deleteControl: (id: string) => boolean
  createRisk: (input: CreateRiskInput) => RiskItem
  updateRisk: (id: string, input: UpdateRiskInput) => RiskItem | undefined
  deleteRisk: (id: string) => boolean
  linkEvidenceToControl: (evidenceId: string, controlId: string) => boolean
  unlinkEvidenceFromControl: (evidenceId: string, controlId: string) => boolean
  updateSettings: (updates: Partial<AppSettings>) => AppSettings
}

export const AppDataContext = createContext<AppDataContextValue | undefined>(undefined)
