import { mockControls } from '../../features/controls/data/mock-controls'
import { mockEvidence } from '../../features/evidence/data/mock-evidence'
import { mockRisks } from '../../features/risks/data/mock-risks'
import type { Control, EvidenceItem, RiskItem } from '../../shared/types'
import { createLocalId, LOCAL_STORE_KEYS, localStore } from './local-store'

export type CreateControlInput = Omit<Control, 'id'>
export type UpdateControlInput = Partial<Omit<Control, 'id'>>

function getAll(): Control[] {
  return localStore.get(LOCAL_STORE_KEYS.controls, mockControls, Array.isArray)
}

function getEvidence(): EvidenceItem[] {
  return localStore.get(LOCAL_STORE_KEYS.evidence, mockEvidence, Array.isArray)
}

function validEvidenceIds(projectId: string, ids: string[]): string[] {
  const validIds = new Set(
    getEvidence()
      .filter((item) => item.projectId === projectId)
      .map((item) => item.id),
  )
  return [...new Set(ids)].filter((id) => validIds.has(id))
}

function syncEvidence(control: Control): void {
  const linkedIds = new Set(control.linkedEvidenceIds)
  const evidence = getEvidence().map((item) => {
    const shouldLink = item.projectId === control.projectId && linkedIds.has(item.id)
    const currentlyLinked = item.linkedControlIds.includes(control.id)
    if (shouldLink === currentlyLinked) return item

    return {
      ...item,
      linkedControlIds: shouldLink
        ? [...item.linkedControlIds, control.id]
        : item.linkedControlIds.filter((id) => id !== control.id),
      updatedAt: new Date().toISOString(),
    }
  })
  localStore.set(LOCAL_STORE_KEYS.evidence, evidence)
}

export const controlsRepository = {
  getAll,

  getByProject(projectId: string): Control[] {
    return getAll().filter((control) => control.projectId === projectId)
  },

  getById(id: string): Control | undefined {
    return getAll().find((control) => control.id === id)
  },

  create(input: CreateControlInput): Control {
    const control: Control = {
      ...input,
      id: createLocalId('control'),
      linkedEvidenceIds: validEvidenceIds(input.projectId, input.linkedEvidenceIds),
    }
    localStore.set(LOCAL_STORE_KEYS.controls, [...getAll(), control])
    syncEvidence(control)
    return control
  },

  update(id: string, input: UpdateControlInput): Control | undefined {
    const current = getAll().find((control) => control.id === id)
    if (!current) return undefined

    const projectId = input.projectId ?? current.projectId
    const updated: Control = {
      ...current,
      ...input,
      id,
      projectId,
      linkedEvidenceIds: validEvidenceIds(
        projectId,
        input.linkedEvidenceIds ?? current.linkedEvidenceIds,
      ),
    }
    localStore.set(
      LOCAL_STORE_KEYS.controls,
      getAll().map((control) => (control.id === id ? updated : control)),
    )
    syncEvidence(updated)
    return updated
  },

  delete(id: string): boolean {
    const controls = getAll()
    if (!controls.some((control) => control.id === id)) return false

    localStore.set(LOCAL_STORE_KEYS.controls, controls.filter((control) => control.id !== id))
    localStore.set(
      LOCAL_STORE_KEYS.evidence,
      getEvidence().map((item) => ({
        ...item,
        linkedControlIds: item.linkedControlIds.filter((controlId) => controlId !== id),
      })),
    )
    localStore.set(
      LOCAL_STORE_KEYS.risks,
      localStore.get<RiskItem[]>(LOCAL_STORE_KEYS.risks, mockRisks, Array.isArray).map((risk) =>
        risk.relatedControlId === id ? { ...risk, relatedControlId: undefined } : risk,
      ),
    )
    return true
  },

  linkEvidence(controlId: string, evidenceId: string): boolean {
    const control = this.getById(controlId)
    const evidence = getEvidence().find((item) => item.id === evidenceId)
    if (!control || !evidence || control.projectId !== evidence.projectId) return false
    if (control.linkedEvidenceIds.includes(evidenceId)) return true
    return Boolean(this.update(controlId, {
      linkedEvidenceIds: [...control.linkedEvidenceIds, evidenceId],
    }))
  },

  unlinkEvidence(controlId: string, evidenceId: string): boolean {
    const control = this.getById(controlId)
    if (!control) return false
    if (!control.linkedEvidenceIds.includes(evidenceId)) return true
    return Boolean(this.update(controlId, {
      linkedEvidenceIds: control.linkedEvidenceIds.filter((id) => id !== evidenceId),
    }))
  },
}
