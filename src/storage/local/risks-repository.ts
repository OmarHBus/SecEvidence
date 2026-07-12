import { mockControls } from '../../features/controls/data/mock-controls'
import { mockRisks } from '../../features/risks/data/mock-risks'
import type { RiskItem } from '../../shared/types'
import { createLocalId, LOCAL_STORE_KEYS, localStore } from './local-store'

export type CreateRiskInput = Omit<RiskItem, 'id' | 'createdAt'>
export type UpdateRiskInput = Partial<Omit<RiskItem, 'id' | 'createdAt'>>

function getAll(): RiskItem[] {
  return localStore.get(LOCAL_STORE_KEYS.risks, mockRisks, Array.isArray)
}

function validRelatedControlId(projectId: string, controlId?: string): string | undefined {
  if (!controlId) return undefined
  const controls = localStore.get(LOCAL_STORE_KEYS.controls, mockControls, Array.isArray)
  return controls.some((control) => control.id === controlId && control.projectId === projectId)
    ? controlId
    : undefined
}

export const risksRepository = {
  getAll,

  getByProject(projectId: string): RiskItem[] {
    return getAll().filter((risk) => risk.projectId === projectId)
  },

  getById(id: string): RiskItem | undefined {
    return getAll().find((risk) => risk.id === id)
  },

  create(input: CreateRiskInput): RiskItem {
    const risk: RiskItem = {
      ...input,
      id: createLocalId('risk'),
      relatedControlId: validRelatedControlId(input.projectId, input.relatedControlId),
      createdAt: new Date().toISOString(),
    }
    localStore.set(LOCAL_STORE_KEYS.risks, [...getAll(), risk])
    return risk
  },

  update(id: string, input: UpdateRiskInput): RiskItem | undefined {
    const current = getAll().find((risk) => risk.id === id)
    if (!current) return undefined

    const projectId = input.projectId ?? current.projectId
    const updated: RiskItem = {
      ...current,
      ...input,
      id,
      projectId,
      relatedControlId: validRelatedControlId(
        projectId,
        input.relatedControlId ?? current.relatedControlId,
      ),
      createdAt: current.createdAt,
    }
    localStore.set(
      LOCAL_STORE_KEYS.risks,
      getAll().map((risk) => (risk.id === id ? updated : risk)),
    )
    return updated
  },

  delete(id: string): boolean {
    const risks = getAll()
    if (!risks.some((risk) => risk.id === id)) return false
    localStore.set(LOCAL_STORE_KEYS.risks, risks.filter((risk) => risk.id !== id))
    return true
  },
}
