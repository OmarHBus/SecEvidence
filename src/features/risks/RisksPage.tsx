import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AlertOctagon, AlertTriangle, Pencil, Plus, Search, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  DialogBody,
  EmptyState,
  ActionGroup,
  IconButton,
  FormField,
  inputClass,
  StatCard,
  type Column,
} from '../../shared/components'
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
    {
      key: 'gap',
      header: 'Gap / risk',
      width: '38%',
      render: (risk) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100" title={risk.title}>{risk.title}</p>
          {risk.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-500" title={risk.description}>{risk.description}</p>
          ) : null}
          {risk.recommendation ? (
            <p className="mt-1 truncate text-[11px] text-zinc-600" title={risk.recommendation}>{risk.recommendation}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      width: '12%',
      render: (risk) => <Badge tone={severityTone[risk.severity]}>{risk.severity}</Badge>,
    },
    {
      key: 'control',
      header: 'Control',
      width: '18%',
      render: (risk) => {
        const name = risk.relatedControlId ? controlNameById.get(risk.relatedControlId) ?? 'Unknown control' : '—'
        return <span className="block truncate text-xs text-zinc-400" title={name}>{name}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (risk) => <Badge tone={statusTone[risk.status]}>{risk.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '96px',
      align: 'right',
      hideHeader: true,
      render: (risk) => (
        <ActionGroup>
          <IconButton icon={Pencil} label={`Edit ${risk.title}`} variant="edit" onClick={() => setDialogRisk(risk)} />
          <IconButton
            icon={Trash2}
            label={`Delete ${risk.title}`}
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete risk or gap "${risk.title}"?`)) deleteRisk(risk.id)
            }}
          />
        </ActionGroup>
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
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">Risks / Gaps</h2>
          <p className="mt-1 text-xs text-zinc-500">{filteredRisks.length} of {risks.length} items shown</p>
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
    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
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
  }, [])

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
    <Dialog
      titleId="risk-dialog-title"
      title={risk ? 'Edit risk / gap' : 'Add risk / gap'}
      description="Document the issue, its impact, and recommended remediation."
      onClose={onClose}
      maxWidth="md"
      onSubmit={handleSubmit}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{risk ? 'Save changes' : 'Add risk / gap'}</Button>
        </>
      )}
    >
      <DialogBody>
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
      </DialogBody>
    </Dialog>
  )
}
