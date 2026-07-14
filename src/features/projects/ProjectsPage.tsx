import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, FolderOpen, FolderPlus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../app/state/useAppData'
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  EmptyState,
  FormField,
  inputClass,
  ProgressBar,
} from '../../shared/components'
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
        <p className="text-sm text-zinc-400">Choose a local evidence workspace to continue.</p>
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
          <Card key={project.id} className={`p-5 ${isActive ? 'border-teal-500/30 ring-1 ring-teal-500/15' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-lg border border-teal-500/15 bg-teal-500/10 text-teal-300"><FolderPlus size={19} strokeWidth={2} /></div>
              <div className="flex flex-wrap justify-end gap-2">
                {isActive ? <Badge tone="green">Active project</Badge> : null}
                <Badge tone="cyan">{project.packType}</Badge>
              </div>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-zinc-50">{project.clientName} — {project.projectName}</h2>
            <p className="mt-3 min-h-10 text-sm leading-5 text-zinc-500">{project.description || 'No description provided.'}</p>
            <div className="mt-5 flex items-center justify-between text-xs"><span className="text-zinc-500">Readiness</span><span className="font-semibold text-zinc-200">{project.readinessPercent}%</span></div>
            <div className="mt-2"><ProgressBar value={project.readinessPercent} /></div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/[0.06] py-4 text-center">
              <Metric value={String(project.evidenceCount)} label="Evidence" />
              <Metric value={`${project.controlsCovered}/${project.controlsTotal}`} label="Controls" />
              <Metric value={String(project.openGaps)} label="Gaps" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500"><CalendarDays size={14} />Updated {formatDate(project.updatedAt)}</span>
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
  return <div><p className="font-semibold text-zinc-200">{value}</p><p className="mt-1 text-[11px] text-zinc-500">{label}</p></div>
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
  }, [])

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
    <Dialog
      titleId="new-project-title"
      title="Create a new project"
      description="Start a local workspace for a cybersecurity evidence pack."
      onClose={onClose}
      maxWidth="md"
      scrollable={false}
      onSubmit={handleSubmit}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create project</Button>
        </>
      )}
    >
      <DialogBody>
        <FormField id="client-name" label="Client name" required error={errors.clientName}>
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
        <FormField id="project-name" label="Project name" required error={errors.projectName}>
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
        <FormField id="deadline" label="Deadline (optional)" className="sm:col-span-2">
          <input
            id="deadline"
            type="date"
            className={inputClass}
            value={form.deadline}
            onChange={(event) => updateField('deadline', event.target.value)}
          />
        </FormField>
      </DialogBody>
    </Dialog>
  )
}
