import { mockControls } from '../../features/controls/data/mock-controls'
import { mockEvidence } from '../../features/evidence/data/mock-evidence'
import { mockProjects } from '../../features/projects/data/mock-projects'
import { mockRisks } from '../../features/risks/data/mock-risks'
import type { Project } from '../../shared/types'
import { createLocalId, LOCAL_STORE_KEYS, localStore } from './local-store'

export type CreateProjectInput = Omit<
  Project,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'readinessPercent'
  | 'evidenceCount'
  | 'controlsCovered'
  | 'controlsTotal'
  | 'openGaps'
  | 'highRiskGaps'
>
export type UpdateProjectInput = Partial<CreateProjectInput>

function getAll(): Project[] {
  return localStore.get(LOCAL_STORE_KEYS.projects, mockProjects, Array.isArray)
}

export const projectRepository = {
  getAll,

  getById(id: string): Project | undefined {
    return getAll().find((project) => project.id === id)
  },

  create(input: CreateProjectInput): Project {
    const now = new Date().toISOString()
    const project: Project = {
      ...input,
      id: createLocalId('project'),
      createdAt: now,
      updatedAt: now,
      readinessPercent: 0,
      evidenceCount: 0,
      controlsCovered: 0,
      controlsTotal: 0,
      openGaps: 0,
      highRiskGaps: 0,
    }
    localStore.set(LOCAL_STORE_KEYS.projects, [...getAll(), project])
    return project
  },

  update(id: string, input: UpdateProjectInput): Project | undefined {
    let updated: Project | undefined
    const projects = getAll().map((project) => {
      if (project.id !== id) return project
      updated = { ...project, ...input, id, updatedAt: new Date().toISOString() }
      return updated
    })
    if (updated) localStore.set(LOCAL_STORE_KEYS.projects, projects)
    return updated
  },

  delete(id: string): boolean {
    const projects = getAll()
    if (!projects.some((project) => project.id === id)) return false

    localStore.set(LOCAL_STORE_KEYS.projects, projects.filter((project) => project.id !== id))
    localStore.set(
      LOCAL_STORE_KEYS.evidence,
      localStore.get(LOCAL_STORE_KEYS.evidence, mockEvidence, Array.isArray).filter((item) => item.projectId !== id),
    )
    localStore.set(
      LOCAL_STORE_KEYS.controls,
      localStore.get(LOCAL_STORE_KEYS.controls, mockControls, Array.isArray).filter((control) => control.projectId !== id),
    )
    localStore.set(
      LOCAL_STORE_KEYS.risks,
      localStore.get(LOCAL_STORE_KEYS.risks, mockRisks, Array.isArray).filter((risk) => risk.projectId !== id),
    )
    return true
  },
}
