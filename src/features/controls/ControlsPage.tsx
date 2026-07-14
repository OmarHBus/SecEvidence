import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Circle, CircleDot, Pencil, Plus, Search, ShieldAlert, Trash2, TriangleAlert } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  EmptyState,
  FilterChip,
  FormField,
  IconButton,
  ActionGroup,
  inputClass,
  ProgressBar,
  dialogCheckboxGridClass,
  dialogCheckboxLabelClass,
  dialogEmptyHintClass,
  dialogLegendClass,
} from '../../shared/components'
import type { Control, ControlStatus, EvidenceCategory, EvidenceItem, RiskSeverity } from '../../shared/types'
import { categoryLabels } from '../../shared/utils/formatters'

const statusConfig: Record<ControlStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'slate'; icon: typeof Circle }> = {
  covered: { label: 'Covered', tone: 'green', icon: CheckCircle2 },
  gap: { label: 'Gap', tone: 'red', icon: TriangleAlert },
  in_progress: { label: 'In progress', tone: 'amber', icon: CircleDot },
  not_applicable: { label: 'Not applicable', tone: 'slate', icon: Circle },
}
const riskTone: Record<RiskSeverity, 'green' | 'amber' | 'red'> = { low: 'green', medium: 'amber', high: 'red', critical: 'red' }
const categories = Object.keys(categoryLabels) as EvidenceCategory[]
const statuses = Object.keys(statusConfig) as ControlStatus[]
const riskLevels: RiskSeverity[] = ['low', 'medium', 'high', 'critical']

interface ControlForm {
  name: string
  description: string
  category: EvidenceCategory
  status: ControlStatus
  riskLevel: RiskSeverity
  owner: string
  notes: string
  linkedEvidenceIds: string[]
}

const emptyForm: ControlForm = {
  name: '',
  description: '',
  category: categories[0],
  status: 'in_progress',
  riskLevel: 'medium',
  owner: '',
  notes: '',
  linkedEvidenceIds: [],
}

const optionalText = (value: string) => value.trim() || undefined

export function ControlsPage() {
  const {
    activeProjectId,
    controls,
    evidenceItems,
    risks,
    createControl,
    updateControl,
    deleteControl,
    createRisk,
  } = useAppData()
  const [statusFilter, setStatusFilter] = useState<ControlStatus | 'all'>('all')
  const [dialogControl, setDialogControl] = useState<Control | null | undefined>(undefined)
  const [riskFeedback, setRiskFeedback] = useState<Record<string, string>>({})

  const evidenceById = useMemo(
    () => new Map(evidenceItems.map((item) => [item.id, item])),
    [evidenceItems],
  )
  const filteredControls = statusFilter === 'all'
    ? controls
    : controls.filter((control) => control.status === statusFilter)
  const applicableControls = controls.filter((control) => control.status !== 'not_applicable').length
  const coveredControls = controls.filter((control) => control.status === 'covered').length
  const coveragePercent = applicableControls === 0
    ? 0
    : Math.round((coveredControls / applicableControls) * 100)

  const createRiskFromGap = (control: Control) => {
    const duplicate = risks.some(
      (risk) => risk.relatedControlId === control.id
        && (risk.status === 'open' || risk.status === 'in_progress'),
    )
    if (duplicate) {
      setRiskFeedback((current) => ({
        ...current,
        [control.id]: 'An open risk already exists for this control.',
      }))
      return
    }

    createRisk({
      projectId: control.projectId,
      title: `Control gap: ${control.name}`,
      description: control.description
        ? `The control "${control.name}" has a documented gap. ${control.description}`
        : `The control "${control.name}" has a documented gap that requires remediation.`,
      severity: control.riskLevel,
      relatedControlId: control.id,
      recommendation: `Define and implement a remediation plan for "${control.name}", assign an owner, and link evidence when completed.`,
      status: 'open',
    })
    setRiskFeedback((current) => ({
      ...current,
      [control.id]: 'Risk created.',
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-slate-400">{coveredControls} of {applicableControls} applicable controls covered</span>
            <span className="font-medium text-teal-300">{coveragePercent}%</span>
          </div>
          <ProgressBar value={coveragePercent} />
        </div>
        <Button icon={Plus} disabled={!activeProjectId} onClick={() => setDialogControl(null)}>Add control</Button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filter controls by status">
        {(['all', ...statuses] as const).map((status) => {
          const count = status === 'all'
            ? controls.length
            : controls.filter((control) => control.status === status).length
          const label = status === 'all' ? 'All controls' : statusConfig[status].label
          return (
            <FilterChip
              key={status}
              selected={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {label} {count}
            </FilterChip>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        {!activeProjectId ? (
          <div className="p-5"><EmptyState icon={ShieldAlert} title="No active project" description="Select or create a project before managing controls." /></div>
        ) : controls.length === 0 ? (
          <div className="p-5"><EmptyState icon={Plus} title="No controls yet" description="Add the first control for this project." /></div>
        ) : filteredControls.length === 0 ? (
          <div className="p-5"><EmptyState icon={Search} title="No matching controls" description="Choose another status filter to see controls." /></div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
          {filteredControls.map((control) => {
          const config = statusConfig[control.status]
          const Icon = config.icon
          const linkedEvidence = control.linkedEvidenceIds
            .map((id) => evidenceById.get(id))
            .filter((item): item is EvidenceItem => Boolean(item))
          const hasOpenRisk = risks.some(
            (risk) => risk.relatedControlId === control.id
              && (risk.status === 'open' || risk.status === 'in_progress'),
          )

          return (
            <article key={control.id} className="p-4 transition-colors hover:bg-white/[0.02]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-zinc-800/60 text-zinc-400"><Icon size={18} strokeWidth={2} aria-hidden="true" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-100">{control.name}</h3>
                      <Badge tone={config.tone}>{config.label}</Badge>
                      <Badge tone={riskTone[control.riskLevel]}>{control.riskLevel} risk</Badge>
                    </div>
                    {control.description ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{control.description}</p> : null}
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                      <div><dt className="inline text-slate-600">Category: </dt><dd className="inline text-slate-400">{categoryLabels[control.category]}</dd></div>
                      <div><dt className="inline text-slate-600">Owner: </dt><dd className="inline text-slate-400">{control.owner ?? '—'}</dd></div>
                      <div className="sm:col-span-2">
                        <dt className="inline text-slate-600">Linked evidence ({linkedEvidence.length}): </dt>
                        <dd className="inline text-slate-400">{linkedEvidence.map((item) => item.title).join(', ') || '—'}</dd>
                      </div>
                      <div className="sm:col-span-2"><dt className="inline text-slate-600">Notes: </dt><dd className="inline text-slate-400">{control.notes ?? '—'}</dd></div>
                    </dl>
                    {control.status === 'covered' && linkedEvidence.length === 0 ? (
                      <p className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                        <TriangleAlert size={15} aria-hidden="true" /> Covered without linked evidence
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1 xl:justify-end">
                  {control.status === 'gap' ? (
                    <Button variant="secondary" icon={ShieldAlert} onClick={() => createRiskFromGap(control)}>
                      {hasOpenRisk ? 'Open risk exists' : 'Create risk from gap'}
                    </Button>
                  ) : null}
                  <ActionGroup>
                    <IconButton icon={Pencil} label={`Edit ${control.name}`} variant="edit" onClick={() => setDialogControl(control)} />
                    <IconButton
                      icon={Trash2}
                      label={`Delete ${control.name}`}
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Delete control "${control.name}"?`)) deleteControl(control.id)
                      }}
                    />
                  </ActionGroup>
                  {riskFeedback[control.id] ? (
                    <p className="basis-full text-right text-xs text-slate-400" role="status">{riskFeedback[control.id]}</p>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
          </div>
        )}
      </Card>

      {dialogControl !== undefined && activeProjectId ? (
        <ControlDialog
          control={dialogControl}
          evidenceItems={evidenceItems}
          onClose={() => setDialogControl(undefined)}
          onSubmit={(form) => {
            const payload = {
              projectId: activeProjectId,
              name: form.name.trim(),
              description: optionalText(form.description),
              category: form.category,
              status: form.status,
              riskLevel: form.riskLevel,
              owner: optionalText(form.owner),
              notes: optionalText(form.notes),
              linkedEvidenceIds: form.linkedEvidenceIds,
            }
            if (dialogControl) updateControl(dialogControl.id, payload)
            else createControl(payload)
            setDialogControl(undefined)
          }}
        />
      ) : null}
    </div>
  )
}

function ControlDialog({
  control,
  evidenceItems,
  onClose,
  onSubmit,
}: {
  control: Control | null
  evidenceItems: EvidenceItem[]
  onClose: () => void
  onSubmit: (form: ControlForm) => void
}) {
  const [form, setForm] = useState<ControlForm>(() => control ? {
    name: control.name,
    description: control.description ?? '',
    category: control.category,
    status: control.status,
    riskLevel: control.riskLevel,
    owner: control.owner ?? '',
    notes: control.notes ?? '',
    linkedEvidenceIds: control.linkedEvidenceIds,
  } : emptyForm)
  const [nameError, setNameError] = useState<string>()
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const updateField = <Key extends keyof ControlForm>(field: Key, value: ControlForm[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'name') setNameError(undefined)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setNameError('Name is required.')
      nameRef.current?.focus()
      return
    }
    onSubmit(form)
  }

  const toggleEvidence = (evidenceId: string) => {
    updateField(
      'linkedEvidenceIds',
      form.linkedEvidenceIds.includes(evidenceId)
        ? form.linkedEvidenceIds.filter((id) => id !== evidenceId)
        : [...form.linkedEvidenceIds, evidenceId],
    )
  }

  return (
    <Dialog
      titleId="control-dialog-title"
      title={control ? 'Edit control' : 'Add control'}
      description="Define the control and link supporting evidence."
      onClose={onClose}
      maxWidth="lg"
      onSubmit={handleSubmit}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{control ? 'Save changes' : 'Add control'}</Button>
        </>
      )}
    >
      <DialogBody>
        <div className="sm:col-span-2">
          <FormField id="control-name" label="Name" required error={nameError}>
            <input ref={nameRef} id="control-name" className={inputClass} value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'control-name-error' : undefined} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField id="control-description" label="Description">
            <textarea id="control-description" className={`${inputClass} min-h-20 resize-y py-2.5`} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </FormField>
        </div>
        <FormField id="control-category" label="Category">
          <select id="control-category" className={inputClass} value={form.category} onChange={(event) => updateField('category', event.target.value as EvidenceCategory)}>
            {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
          </select>
        </FormField>
        <FormField id="control-status" label="Status">
          <select id="control-status" className={inputClass} value={form.status} onChange={(event) => updateField('status', event.target.value as ControlStatus)}>
            {statuses.map((status) => <option key={status} value={status}>{statusConfig[status].label}</option>)}
          </select>
        </FormField>
        <FormField id="control-risk" label="Risk level">
          <select id="control-risk" className={inputClass} value={form.riskLevel} onChange={(event) => updateField('riskLevel', event.target.value as RiskSeverity)}>
            {riskLevels.map((riskLevel) => <option key={riskLevel} value={riskLevel}>{riskLevel[0].toUpperCase()}{riskLevel.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField id="control-owner" label="Owner">
          <input id="control-owner" className={inputClass} value={form.owner} onChange={(event) => updateField('owner', event.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField id="control-notes" label="Notes">
            <textarea id="control-notes" className={`${inputClass} min-h-20 resize-y py-2.5`} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </FormField>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className={dialogLegendClass}>Linked evidence</legend>
          {evidenceItems.length === 0 ? (
            <p className={dialogEmptyHintClass}>This project has no evidence to link.</p>
          ) : (
            <div className={dialogCheckboxGridClass}>
              {evidenceItems.map((item) => (
                <label key={item.id} className={dialogCheckboxLabelClass}>
                  <input type="checkbox" className="mt-0.5 size-4 accent-teal-400" checked={form.linkedEvidenceIds.includes(item.id)} onChange={() => toggleEvidence(item.id)} />
                  <span><span className="block">{item.title}</span><span className="text-xs text-zinc-600">{categoryLabels[item.category]}</span></span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        {form.status === 'covered' && form.linkedEvidenceIds.length === 0 ? (
          <p className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200" role="alert">
            <TriangleAlert size={16} aria-hidden="true" /> Covered without linked evidence
          </p>
        ) : null}
      </DialogBody>
    </Dialog>
  )
}
