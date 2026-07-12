import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, FolderOpen, FolderPlus, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Button, Card, EmptyState, ProgressBar } from '../../shared/components'
import { formatDate } from '../../shared/utils/formatters'

const PACK_TYPES = [
  'Basic Security Evidence Pack',
  'Client Security Review',
  'ISO 27001 Readiness Pack',
  'NIS2 Readiness Pack',
  'Internal Security Assessment',
  'Vendor Security Questionnaire Pack',
  'Custom Pack',
] as const

interface ProjectForm {
  clientName: string
  projectName: string
  packType: string
  description: string
  deadline: string
}

const EMPTY_FORM: ProjectForm = {
  clientName: '',
  projectName: '',
  packType: PACK_TYPES[0],
  description: '',
  deadline: '',
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, createProject, selectProject, activeProjectId } = useAppData()
  const [isCreating, setIsCreating] = useState(false)

  const openProject = (projectId: string) => {
    if (selectProject(projectId)) navigate('/overview')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-400">Choose a local evidence workspace to continue.</p>
        <Button icon={Plus} onClick={() => setIsCreating(true)}>New project</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a local project to organize evidence, track control coverage, and prepare your first evidence pack."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId
            return (
          <Card key={project.id} className={`p-5 ${isActive ? 'border-cyan-400/50 ring-1 ring-cyan-400/20' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-lg bg-slate-800 text-cyan-300"><FolderPlus size={19} /></div>
              <div className="flex flex-wrap justify-end gap-2">
                {isActive ? <Badge tone="green">Active project</Badge> : null}
                <Badge tone="cyan">{project.packType}</Badge>
              </div>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-50">{project.clientName} — {project.projectName}</h2>
            <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{project.description || 'No description provided.'}</p>
            <div className="mt-5 flex items-center justify-between text-xs"><span className="text-slate-500">Readiness</span><span className="font-semibold text-slate-200">{project.readinessPercent}%</span></div>
            <div className="mt-2"><ProgressBar value={project.readinessPercent} /></div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-800 py-4 text-center">
              <Metric value={String(project.evidenceCount)} label="Evidence" />
              <Metric value={`${project.controlsCovered}/${project.controlsTotal}`} label="Controls" />
              <Metric value={String(project.openGaps)} label="Gaps" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />Updated {formatDate(project.updatedAt)}</span>
              <Button variant="ghost" icon={ArrowRight} onClick={() => openProject(project.id)}>
                {isActive ? 'Continue' : 'Open'}
              </Button>
            </div>
          </Card>
            )
          })}
        </div>
      )}

      {isCreating ? (
        <NewProjectDialog
          onClose={() => setIsCreating(false)}
          onCreate={(form) => {
            createProject({
              clientName: form.clientName.trim(),
              projectName: form.projectName.trim(),
              packType: form.packType,
              description: form.description.trim() || undefined,
              deadline: form.deadline || undefined,
            })
            setIsCreating(false)
            navigate('/overview')
          }}
        />
      ) : null}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div><p className="font-semibold text-slate-200">{value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>
}

function NewProjectDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: ProjectForm) => void
}) {
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectForm, string>>>({})
  const clientNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    clientNameRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateField = <Key extends keyof ProjectForm>(field: Key, value: ProjectForm[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!form.clientName.trim()) nextErrors.clientName = 'Client name is required.'
    if (!form.projectName.trim()) nextErrors.projectName = 'Project name is required.'
    if (!form.packType) nextErrors.packType = 'Pack type is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onCreate(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="new-project-title" className="font-semibold text-slate-100">Create a new project</h2>
            <p className="mt-1 text-xs text-slate-500">Start a local workspace for a cybersecurity evidence pack.</p>
          </div>
          <Button variant="ghost" className="size-9 px-0" onClick={onClose} aria-label="Close new project dialog">
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <FormField
              id="client-name"
              label="Client name"
              required
              error={errors.clientName}
            >
              <input
                ref={clientNameRef}
                id="client-name"
                className={inputClass}
                value={form.clientName}
                onChange={(event) => updateField('clientName', event.target.value)}
                aria-invalid={Boolean(errors.clientName)}
                aria-describedby={errors.clientName ? 'client-name-error' : undefined}
              />
            </FormField>
            <FormField
              id="project-name"
              label="Project name"
              required
              error={errors.projectName}
            >
              <input
                id="project-name"
                className={inputClass}
                value={form.projectName}
                onChange={(event) => updateField('projectName', event.target.value)}
                aria-invalid={Boolean(errors.projectName)}
                aria-describedby={errors.projectName ? 'project-name-error' : undefined}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField id="pack-type" label="Pack type" required error={errors.packType}>
                <select
                  id="pack-type"
                  className={inputClass}
                  value={form.packType}
                  onChange={(event) => updateField('packType', event.target.value)}
                  aria-invalid={Boolean(errors.packType)}
                  aria-describedby={errors.packType ? 'pack-type-error' : undefined}
                >
                  {PACK_TYPES.map((packType) => <option key={packType} value={packType}>{packType}</option>)}
                </select>
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField id="description" label="Description">
                <textarea
                  id="description"
                  className={`${inputClass} min-h-24 resize-y py-2.5`}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                />
              </FormField>
            </div>
            <FormField id="deadline" label="Deadline (optional)">
              <input
                id="deadline"
                type="date"
                className={inputClass}
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create project</Button>
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
