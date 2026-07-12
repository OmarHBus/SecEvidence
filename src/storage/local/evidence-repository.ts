import { mockControls } from '../../features/controls/data/mock-controls'
import { mockEvidence } from '../../features/evidence/data/mock-evidence'
import type { Control, EvidenceItem } from '../../shared/types'
import { createLocalId, LOCAL_STORE_KEYS, localStore } from './local-store'

export type CreateEvidenceInput = Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateEvidenceInput = Partial<Omit<EvidenceItem, 'id' | 'createdAt' | 'updatedAt'>>

function getAll(): EvidenceItem[] {
  return localStore.get(LOCAL_STORE_KEYS.evidence, mockEvidence, Array.isArray)
}

function getControls(): Control[] {
  return localStore.get(LOCAL_STORE_KEYS.controls, mockControls, Array.isArray)
}

function validControlIds(projectId: string, ids: string[]): string[] {
  const validIds = new Set(
    getControls()
      .filter((control) => control.projectId === projectId)
      .map((control) => control.id),
  )
  return [...new Set(ids)].filter((id) => validIds.has(id))
}

function syncControls(evidence: EvidenceItem): void {
  const linkedIds = new Set(evidence.linkedControlIds)
  const controls = getControls().map((control) => {
    const shouldLink = control.projectId === evidence.projectId && linkedIds.has(control.id)
    const currentlyLinked = control.linkedEvidenceIds.includes(evidence.id)
    if (shouldLink === currentlyLinked) return control

    return {
      ...control,
      linkedEvidenceIds: shouldLink
        ? [...control.linkedEvidenceIds, evidence.id]
        : control.linkedEvidenceIds.filter((id) => id !== evidence.id),
    }
  })
  localStore.set(LOCAL_STORE_KEYS.controls, controls)
}

export const evidenceRepository = {
  getAll,

  getByProject(projectId: string): EvidenceItem[] {
    return getAll().filter((item) => item.projectId === projectId)
  },

  getById(id: string): EvidenceItem | undefined {
    return getAll().find((item) => item.id === id)
  },

  create(input: CreateEvidenceInput): EvidenceItem {
    const now = new Date().toISOString()
    const item: EvidenceItem = {
      ...input,
      id: createLocalId('evidence'),
      linkedControlIds: validControlIds(input.projectId, input.linkedControlIds),
      createdAt: now,
      updatedAt: now,
    }
    localStore.set(LOCAL_STORE_KEYS.evidence, [...getAll(), item])
    syncControls(item)
    return item
  },

  update(id: string, input: UpdateEvidenceInput): EvidenceItem | undefined {
    const current = getAll().find((item) => item.id === id)
    if (!current) return undefined

    const projectId = input.projectId ?? current.projectId
    const updated: EvidenceItem = {
      ...current,
      ...input,
      id,
      projectId,
      linkedControlIds: validControlIds(
        projectId,
        input.linkedControlIds ?? current.linkedControlIds,
      ),
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    localStore.set(
      LOCAL_STORE_KEYS.evidence,
      getAll().map((item) => (item.id === id ? updated : item)),
    )
    syncControls(updated)
    return updated
  },

  delete(id: string): boolean {
    const items = getAll()
    if (!items.some((item) => item.id === id)) return false

    localStore.set(LOCAL_STORE_KEYS.evidence, items.filter((item) => item.id !== id))
    localStore.set(
      LOCAL_STORE_KEYS.controls,
      getControls().map((control) => ({
        ...control,
        linkedEvidenceIds: control.linkedEvidenceIds.filter((evidenceId) => evidenceId !== id),
      })),
    )
    return true
  },

  linkControl(evidenceId: string, controlId: string): boolean {
    const evidence = this.getById(evidenceId)
    const control = getControls().find((item) => item.id === controlId)
    if (!evidence || !control || evidence.projectId !== control.projectId) return false
    if (evidence.linkedControlIds.includes(controlId)) return true
    return Boolean(this.update(evidenceId, {
      linkedControlIds: [...evidence.linkedControlIds, controlId],
    }))
  },

  unlinkControl(evidenceId: string, controlId: string): boolean {
    const evidence = this.getById(evidenceId)
    if (!evidence) return false
    if (!evidence.linkedControlIds.includes(controlId)) return true
    return Boolean(this.update(evidenceId, {
      linkedControlIds: evidence.linkedControlIds.filter((id) => id !== controlId),
    }))
  },
}
