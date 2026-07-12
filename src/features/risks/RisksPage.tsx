import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AlertOctagon, AlertTriangle, Pencil, Plus, Search, ShieldAlert, ShieldCheck, Trash2, X } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Button, Card, DataTable, EmptyState, StatCard, type Column } from '../../shared/components'
import type { Control, RiskItem, RiskSeverity, RiskStatus } from '../../shared/types'

const severityTone = { critical: 'red', high: 'red', medium: 'amber', low: 'slate' } as const
const statusTone = { open: 'red', in_progress: 'amber', accepted: 'slate', closed: 'green' } as const
const severities: RiskSeverity[] = ['critical', 'high', 'medium', 'low']
const statuses: RiskStatus[] = ['open', 'in_progress', 'accepted', 'closed']

interface RiskForm {
  title: string
  description: string
  severity: RiskSeverity
  relatedControlId: string
  recommendation: string
  status: RiskStatus
}

const emptyForm: RiskForm = {
  title: '',
  description: '',
  severity: 'medium',
  relatedControlId: '',
  recommendation: '',
  status: 'open',
}

export function RisksPage() {
  const {
    activeProjectId,
    risks,
    controls,
    createRisk,
    updateRisk,
    deleteRisk,
  } = useAppData()
  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<RiskStatus | 'all'>('all')
  const [dialogRisk, setDialogRisk] = useState<RiskItem | null | undefined>(undefined)

  const controlNameById = useMemo(
    () => new Map(controls.map((control) => [control.id, control.name])),
    [controls],
  )
  const severityCounts = useMemo(
    () => Object.fromEntries(
      severities.map((severity) => [severity, risks.filter((risk) => risk.severity === severity).length]),
    ) as Record<RiskSeverity, number>,
    [risks],
  )
  const filteredRisks = useMemo(
    () => risks.filter((risk) => (
      (severityFilter === 'all' || risk.severity === severityFilter)
      && (statusFilter === 'all' || risk.status === statusFilter)
    )),
    [risks, severityFilter, statusFilter],
  )

  const columns: Column<RiskItem>[] = [
    { key: 'gap', header: 'Gap', render: (risk) => <div className="min-w-56 max-w-md"><p className="font-medium text-slate-200">{risk.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{risk.description}</p></div> },
    { key: 'severity', header: 'Severity', render: (risk) => <Badge tone={severityTone[risk.severity]}>{risk.severity}</Badge> },
    { key: 'control', header: 'Related control', render: (risk) => <span className="block min-w-40 text-slate-300">{risk.relatedControlId ? controlNameById.get(risk.relatedControlId) ?? 'Unknown control' : '—'}</span> },
    { key: 'recommendation', header: 'Recommendation', render: (risk) => <span className="block min-w-56 max-w-md text-xs leading-5 text-slate-500">{risk.recommendation ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (risk) => <Badge tone={statusTone[risk.status]}>{risk.status.replace('_', ' ')}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (risk) => (
        <div className="flex gap-1">
          <Button variant="ghost" className="size-8 px-0" onClick={() => setDialogRisk(risk)} aria-label={`Edit ${risk.title}`}>
            <Pencil size={15} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="size-8 px-0 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
            onClick={() => {
              if (window.confirm(`Delete risk or gap "${risk.title}"?`)) deleteRisk(risk.id)
            }}
            aria-label={`Delete ${risk.title}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ]

  const hasFilters = severityFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Critical" value={String(severityCounts.critical)} detail="Critical risks or gaps" icon={AlertOctagon} tone="red" />
        <StatCard label="High" value={String(severityCounts.high)} detail="High-severity risks or gaps" icon={ShieldAlert} tone="red" />
        <StatCard label="Medium" value={String(severityCounts.medium)} detail="Medium-severity risks or gaps" icon={AlertTriangle} tone="amber" />
        <StatCard label="Low" value={String(severityCounts.low)} detail="Low-severity risks or gaps" icon={ShieldCheck} tone="slate" />
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Severity" value={severityFilter} onChange={(value) => setSeverityFilter(value as RiskSeverity | 'all')}>
            <option value="all">All severities</option>
            {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as RiskStatus | 'all')}>
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </FilterSelect>
          {hasFilters ? <Button variant="ghost" onClick={() => { setSeverityFilter('all'); setStatusFilter('all') }}>Clear filters</Button> : null}
        </div>
        <Button icon={Plus} disabled={!activeProjectId} onClick={() => setDialogRisk(null)}>Add risk / gap</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">Risks / Gaps</h2>
          <p className="mt-1 text-xs text-slate-500">{filteredRisks.length} of {risks.length} items shown</p>
        </div>
        {!activeProjectId ? (
          <div className="p-5"><EmptyState icon={ShieldAlert} title="No active project" description="Select or create a project before managing risks and gaps." /></div>
        ) : risks.length === 0 ? (
          <div className="p-5"><EmptyState icon={Plus} title="No risks or gaps yet" description="Add the first risk or gap for this project." /></div>
        ) : filteredRisks.length === 0 ? (
          <div className="p-5"><EmptyState icon={Search} title="No matching risks or gaps" description="Change or clear the severity and status filters to see results." /></div>
        ) : (
          <DataTable columns={columns} rows={filteredRisks} getKey={(risk) => risk.id} />
        )}
      </Card>

      {dialogRisk !== undefined && activeProjectId ? (
        <RiskDialog
          risk={dialogRisk}
          controls={controls}
          onClose={() => setDialogRisk(undefined)}
          onSubmit={(form) => {
            const payload = {
              projectId: activeProjectId,
              title: form.title.trim(),
              description: form.description.trim(),
              severity: form.severity,
              relatedControlId: form.relatedControlId || (dialogRisk ? '' : undefined),
              recommendation: form.recommendation.trim() || undefined,
              status: form.status,
            }
            if (dialogRisk) updateRisk(dialogRisk.id, payload)
            else createRisk(payload)
            setDialogRisk(undefined)
          }}
        />
      ) : null}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-600">
      {label}
      <select className={`${inputClass} h-9 w-auto min-w-40 py-0 capitalize tracking-normal`} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

function RiskDialog({
  risk,
  controls,
  onClose,
  onSubmit,
}: {
  risk: RiskItem | null
  controls: Control[]
  onClose: () => void
  onSubmit: (form: RiskForm) => void
}) {
  const [form, setForm] = useState<RiskForm>(() => risk ? {
    title: risk.title,
    description: risk.description,
    severity: risk.severity,
    relatedControlId: risk.relatedControlId ?? '',
    recommendation: risk.recommendation ?? '',
    status: risk.status,
  } : emptyForm)
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateField = <Key extends keyof RiskForm>(field: Key, value: RiskForm[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'title' || field === 'description') {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="risk-dialog-title" className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="risk-dialog-title" className="font-semibold text-slate-100">{risk ? 'Edit risk / gap' : 'Add risk / gap'}</h2>
            <p className="mt-1 text-xs text-slate-500">Document the issue, its impact, and recommended remediation.</p>
          </div>
          <Button variant="ghost" className="size-9 px-0" onClick={onClose} aria-label="Close risk dialog"><X size={18} aria-hidden="true" /></Button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-h-[calc(92vh-132px)] overflow-y-auto">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="risk-title" label="Title" required error={errors.title}>
                  <input ref={titleRef} id="risk-title" className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'risk-title-error' : undefined} />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="risk-description" label="Description" required error={errors.description}>
                  <textarea id="risk-description" className={`${inputClass} min-h-24 resize-y py-2.5`} value={form.description} onChange={(event) => updateField('description', event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'risk-description-error' : undefined} />
                </FormField>
              </div>
              <FormField id="risk-severity" label="Severity">
                <select id="risk-severity" className={`${inputClass} capitalize`} value={form.severity} onChange={(event) => updateField('severity', event.target.value as RiskSeverity)}>
                  {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                </select>
              </FormField>
              <FormField id="risk-status" label="Status">
                <select id="risk-status" className={`${inputClass} capitalize`} value={form.status} onChange={(event) => updateField('status', event.target.value as RiskStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                </select>
              </FormField>
              <div className="sm:col-span-2">
                <FormField id="risk-control" label="Related control (optional)">
                  <select id="risk-control" className={inputClass} value={form.relatedControlId} onChange={(event) => updateField('relatedControlId', event.target.value)}>
                    <option value="">No related control</option>
                    {controls.map((control) => <option key={control.id} value={control.id}>{control.name}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="risk-recommendation" label="Recommendation">
                  <textarea id="risk-recommendation" className={`${inputClass} min-h-24 resize-y py-2.5`} value={form.recommendation} onChange={(event) => updateField('recommendation', event.target.value)} />
                </FormField>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{risk ? 'Save changes' : 'Add risk / gap'}</Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-400">
        {label}{required ? <span className="text-rose-400" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15'
