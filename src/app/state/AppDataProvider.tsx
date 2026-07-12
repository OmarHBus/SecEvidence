import {
  useCallback,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { AppSettings } from '../../shared/types'
import {
  controlsRepository,
  type CreateControlInput,
  type UpdateControlInput,
} from '../../storage/local/controls-repository'
import {
  evidenceRepository,
  type CreateEvidenceInput,
  type UpdateEvidenceInput,
} from '../../storage/local/evidence-repository'
import { LOCAL_STORE_KEYS, localStore } from '../../storage/local/local-store'
import {
  projectRepository,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '../../storage/local/project-repository'
import {
  risksRepository,
  type CreateRiskInput,
  type UpdateRiskInput,
} from '../../storage/local/risks-repository'
import { AppDataContext, type AppDataContextValue } from './app-data-context'
import { calculateStats, EMPTY_APP_DATA_STATS } from './app-data-stats'

const DEFAULT_SETTINGS: AppSettings = {
  consultantCompanyName: 'SecEvidence Consulting',
  defaultExportPrefix: 'secevidence',
  reportFooterText: 'Generated locally with SecEvidence',
  localFirstReminderEnabled: true,
  localEvidencePackRootFolder: '',
  exportFolder: '',
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS

  const settings = value as Partial<AppSettings>
  return {
    consultantCompanyName: typeof settings.consultantCompanyName === 'string'
      ? settings.consultantCompanyName
      : DEFAULT_SETTINGS.consultantCompanyName,
    defaultExportPrefix: typeof settings.defaultExportPrefix === 'string'
      ? settings.defaultExportPrefix
      : DEFAULT_SETTINGS.defaultExportPrefix,
    reportFooterText: typeof settings.reportFooterText === 'string'
      ? settings.reportFooterText
      : DEFAULT_SETTINGS.reportFooterText,
    localFirstReminderEnabled: typeof settings.localFirstReminderEnabled === 'boolean'
      ? settings.localFirstReminderEnabled
      : DEFAULT_SETTINGS.localFirstReminderEnabled,
    localEvidencePackRootFolder: typeof settings.localEvidencePackRootFolder === 'string'
      ? settings.localEvidencePackRootFolder
      : DEFAULT_SETTINGS.localEvidencePackRootFolder,
    exportFolder: typeof settings.exportFolder === 'string'
      ? settings.exportFolder
      : DEFAULT_SETTINGS.exportFolder,
  }
}

function getInitialProjectId(): string | null {
  const projects = projectRepository.getAll()
  const persistedId = localStore.get<string | null>(
    LOCAL_STORE_KEYS.activeProjectId,
    projects[0]?.id ?? null,
    isNullableString,
  )
  const activeId = projects.some((project) => project.id === persistedId)
    ? persistedId
    : projects[0]?.id ?? null
  if (activeId !== persistedId) localStore.set(LOCAL_STORE_KEYS.activeProjectId, activeId)
  return activeId
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(getInitialProjectId)
  const [settings, setSettings] = useState<AppSettings>(() =>
    normalizeSettings(localStore.get(LOCAL_STORE_KEYS.settings, DEFAULT_SETTINGS)),
  )
  const [, refresh] = useReducer((value: number) => value + 1, 0)

  const projects = projectRepository.getAll().map((project) => {
    const projectEvidence = evidenceRepository.getByProject(project.id)
    const projectControls = controlsRepository.getByProject(project.id)
    const projectRisks = risksRepository.getByProject(project.id)
    const projectStats = calculateStats(projectEvidence, projectControls, projectRisks)
    return {
      ...project,
      readinessPercent: projectStats.readinessPercent,
      evidenceCount: projectStats.totalEvidence,
      controlsCovered: projectStats.controlsCovered,
      controlsTotal: projectStats.controlsTotal,
      openGaps: projectStats.openGaps,
      highRiskGaps: projectStats.highCriticalGaps,
    }
  })
  const evidenceItems = activeProjectId
    ? evidenceRepository.getByProject(activeProjectId)
    : []
  const controls = activeProjectId ? controlsRepository.getByProject(activeProjectId) : []
  const risks = activeProjectId ? risksRepository.getByProject(activeProjectId) : []
  const stats = activeProjectId ? calculateStats(evidenceItems, controls, risks) : EMPTY_APP_DATA_STATS
  const activeProject = projects.find((project) => project.id === activeProjectId)

  const selectProject = useCallback((projectId: string) => {
    if (!projectRepository.getById(projectId)) return false
    localStore.set(LOCAL_STORE_KEYS.activeProjectId, projectId)
    setActiveProjectId(projectId)
    return true
  }, [])

  const createProject = useCallback((input: CreateProjectInput) => {
    const project = projectRepository.create(input)
    localStore.set(LOCAL_STORE_KEYS.activeProjectId, project.id)
    setActiveProjectId(project.id)
    refresh()
    return project
  }, [])

  const updateProject = useCallback((id: string, input: UpdateProjectInput) => {
    const project = projectRepository.update(id, input)
    if (project) refresh()
    return project
  }, [])

  const deleteProject = useCallback((id: string) => {
    const deleted = projectRepository.delete(id)
    if (!deleted) return false

    if (activeProjectId === id) {
      const nextId = projectRepository.getAll()[0]?.id ?? null
      localStore.set(LOCAL_STORE_KEYS.activeProjectId, nextId)
      setActiveProjectId(nextId)
    }
    refresh()
    return true
  }, [activeProjectId])

  const createEvidence = useCallback((input: CreateEvidenceInput) => {
    const item = evidenceRepository.create(input)
    refresh()
    return item
  }, [])

  const updateEvidence = useCallback((id: string, input: UpdateEvidenceInput) => {
    const item = evidenceRepository.update(id, input)
    if (item) refresh()
    return item
  }, [])

  const deleteEvidence = useCallback((id: string) => {
    const deleted = evidenceRepository.delete(id)
    if (deleted) refresh()
    return deleted
  }, [])

  const createControl = useCallback((input: CreateControlInput) => {
    const control = controlsRepository.create(input)
    refresh()
    return control
  }, [])

  const updateControl = useCallback((id: string, input: UpdateControlInput) => {
    const control = controlsRepository.update(id, input)
    if (control) refresh()
    return control
  }, [])

  const deleteControl = useCallback((id: string) => {
    const deleted = controlsRepository.delete(id)
    if (deleted) refresh()
    return deleted
  }, [])

  const createRisk = useCallback((input: CreateRiskInput) => {
    const risk = risksRepository.create(input)
    refresh()
    return risk
  }, [])

  const updateRisk = useCallback((id: string, input: UpdateRiskInput) => {
    const risk = risksRepository.update(id, input)
    if (risk) refresh()
    return risk
  }, [])

  const deleteRisk = useCallback((id: string) => {
    const deleted = risksRepository.delete(id)
    if (deleted) refresh()
    return deleted
  }, [])

  const linkEvidenceToControl = useCallback((evidenceId: string, controlId: string) => {
    const linked = evidenceRepository.linkControl(evidenceId, controlId)
    if (linked) refresh()
    return linked
  }, [])

  const unlinkEvidenceFromControl = useCallback((evidenceId: string, controlId: string) => {
    const unlinked = evidenceRepository.unlinkControl(evidenceId, controlId)
    if (unlinked) refresh()
    return unlinked
  }, [])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const nextSettings = localStore.set(LOCAL_STORE_KEYS.settings, { ...settings, ...updates })
    setSettings(nextSettings)
    return nextSettings
  }, [settings])

  const value: AppDataContextValue = {
    activeProjectId,
    activeProject,
    projects,
    evidenceItems,
    controls,
    risks,
    settings,
    stats,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    createControl,
    updateControl,
    deleteControl,
    createRisk,
    updateRisk,
    deleteRisk,
    linkEvidenceToControl,
    unlinkEvidenceFromControl,
    updateSettings,
  }

  return <AppDataContext value={value}>{children}</AppDataContext>
}
