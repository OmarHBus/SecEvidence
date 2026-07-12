import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ExternalLink, FilePlus2, FileSearch, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Button, Card, DataTable, EmptyState, type Column } from '../../shared/components'
import type { Control, EvidenceCategory, EvidenceItem, EvidenceStatus } from '../../shared/types'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'
import { EVIDENCE_CATEGORY_FOLDERS } from '../../storage/files/file-types'
import {
  copyEvidenceFileToPack,
  revealEvidenceFile,
  selectEvidenceFile,
} from '../../storage/files/evidence-file-store'
import { ensureProjectPackFolder } from '../../storage/files/local-project-folder'
import { isDesktopApp } from '../../storage/files/tauri-env'
import type { SelectedEvidenceFile } from '../../storage/files/file-types'

const toneByStatus = { accepted: 'green', needs_review: 'amber', missing: 'red', outdated: 'red' } as const

const categories = Object.keys(categoryLabels) as EvidenceCategory[]
const statuses = Object.keys(statusLabels) as EvidenceStatus[]

interface EvidenceForm {
  title: string
  description: string
  category: EvidenceCategory
  status: EvidenceStatus
  owner: string
  evidenceDate: string
  fileName: string
  fileType: string
  fileSize: string
  localPath: string
  notes: string
  linkedControlIds: string[]
}

const emptyForm: EvidenceForm = {
  title: '',
  description: '',
  category: categories[0],
  status: 'needs_review',
  owner: '',
  evidenceDate: '',
  fileName: '',
  fileType: '',
  fileSize: '',
  localPath: '',
  notes: '',
  linkedControlIds: [],
}

const optionalText = (value: string) => value.trim() || undefined

export function EvidenceLibraryPage() {
  const {
    activeProjectId,
    activeProject,
    evidenceItems,
    controls,
    settings,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    updateProject,
  } = useAppData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<EvidenceCategory | 'all'>('all')
  const [dialogItem, setDialogItem] = useState<EvidenceItem | null | undefined>(undefined)
  const [desktopMode, setDesktopMode] = useState(false)

  useEffect(() => {
    void isDesktopApp().then(setDesktopMode)
  }, [])

  const controlNames = useMemo(
    () => new Map(controls.map((control) => [control.id, control.name])),
    [controls],
  )
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return evidenceItems.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (!query) return true
      return [item.title, item.description, item.owner, item.fileName, item.notes]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    })
  }, [categoryFilter, evidenceItems, search, statusFilter])

  const handleEvidenceSubmit = async (form: EvidenceForm, selectedFile: SelectedEvidenceFile | null) => {
    if (!activeProjectId || !activeProject) return

    let localPackPath = activeProject.localPackPath
    if (settings.localEvidencePackRootFolder.trim()) {
      const folderInfo = await ensureProjectPackFolder(
        settings.localEvidencePackRootFolder.trim(),
        activeProject.clientName,
      )
      localPackPath = folderInfo.packFolderPath
      if (localPackPath !== activeProject.localPackPath) {
        updateProject(activeProject.id, { localPackPath })
      }
    }

    let fileName = optionalText(form.fileName)
    let fileType = optionalText(form.fileType)
    let fileSize = form.fileSize === '' ? undefined : Number(form.fileSize)
    let localPath = optionalText(form.localPath)

    if (selectedFile?.sourcePath && localPackPath) {
      const copiedPath = await copyEvidenceFileToPack(
        localPackPath,
        form.category,
        selectedFile.sourcePath,
        selectedFile.fileName,
      )
      if (copiedPath) {
        localPath = copiedPath
        fileName = selectedFile.fileName
        fileType = selectedFile.fileType
        fileSize = selectedFile.fileSize
      }
    } else if (selectedFile && !selectedFile.sourcePath) {
      fileName = selectedFile.fileName
      fileType = selectedFile.fileType
      fileSize = selectedFile.fileSize
    }

    const payload = {
      projectId: activeProjectId,
      title: form.title.trim(),
      description: optionalText(form.description),
      category: form.category,
      status: form.status,
      owner: optionalText(form.owner),
      evidenceDate: form.evidenceDate || undefined,
      fileName,
      fileType,
      fileSize,
      localPath,
      notes: optionalText(form.notes),
      linkedControlIds: form.linkedControlIds,
    }

    if (dialogItem) updateEvidence(dialogItem.id, payload)
    else createEvidence(payload)
    setDialogItem(undefined)
  }

  const columns: Column<EvidenceItem>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (item) => (
        <div className="min-w-44">
          <p className="font-medium text-slate-200">{item.title}</p>
          {item.description ? <p className="mt-1 max-w-64 text-xs text-slate-500">{item.description}</p> : null}
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (item) => <span className="whitespace-nowrap text-slate-400">{categoryLabels[item.category]}</span> },
    { key: 'control', header: 'Linked control', render: (item) => <span className="block min-w-44 max-w-64 text-slate-300">{item.linkedControlIds.map((id) => controlNames.get(id) ?? id).join(', ') || '—'}</span> },
    { key: 'status', header: 'Status', render: (item) => <Badge tone={toneByStatus[item.status]}>{statusLabels[item.status]}</Badge> },
    { key: 'owner', header: 'Owner', render: (item) => <span className="whitespace-nowrap text-slate-400">{item.owner ?? '—'}</span> },
    { key: 'date', header: 'Date', render: (item) => <span className="whitespace-nowrap text-slate-500">{formatDate(item.evidenceDate)}</span> },
    {
      key: 'file',
      header: 'File',
      render: (item) => (
        <div className="max-w-48 text-xs text-slate-400">
          <p className="truncate" title={item.fileName}>{item.fileName ?? '—'}</p>
          {item.fileType || item.fileSize !== undefined
            ? <p className="mt-1 text-slate-600">{[item.fileType, item.fileSize !== undefined ? `${item.fileSize.toLocaleString()} bytes` : undefined].filter(Boolean).join(' · ')}</p>
            : null}
        </div>
      ),
    },
    { key: 'notes', header: 'Notes', render: (item) => <span className="block min-w-48 max-w-72 text-xs leading-5 text-slate-500">{item.notes ?? '—'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex gap-1">
          {item.localPath && desktopMode ? (
            <Button
              variant="ghost"
              className="size-8 px-0"
              onClick={() => void revealEvidenceFile(item.localPath!)}
              aria-label={`Reveal ${item.title} file`}
              title="Reveal file"
            >
              <ExternalLink size={15} aria-hidden="true" />
            </Button>
          ) : null}
          <Button variant="ghost" className="size-8 px-0" onClick={() => setDialogItem(item)} aria-label={`Edit ${item.title}`}>
            <Pencil size={15} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="size-8 px-0 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
            onClick={() => {
              if (window.confirm(`Delete evidence "${item.title}"?`)) deleteEvidence(item.id)
            }}
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ]

  const hasFilters = Boolean(search.trim()) || statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-500 focus-within:border-cyan-400 xl:max-w-md">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search evidence</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, owner, file, notes…"
            className="min-w-0 flex-1 bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
          />
        </label>
        <Button icon={FilePlus2} disabled={!activeProjectId} onClick={() => setDialogItem(null)}>Add evidence</Button>
      </div>

      {!settings.localEvidencePackRootFolder.trim() ? (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Set a local evidence pack folder in Settings to copy real files into an organized pack structure.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as EvidenceStatus | 'all')}>
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </FilterSelect>
        <FilterSelect label="Category" value={categoryFilter} onChange={(value) => setCategoryFilter(value as EvidenceCategory | 'all')}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
        </FilterSelect>
        {hasFilters ? <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all') }}>Clear filters</Button> : null}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs text-slate-500">
          <span>{filteredItems.length} of {evidenceItems.length} items shown</span>
          <span>{activeProject?.localPackPath ? 'Pack folder ready' : 'Active project'}</span>
        </div>
        {!activeProjectId ? (
          <div className="p-5"><EmptyState icon={FileSearch} title="No active project" description="Select or create a project before managing its evidence library." /></div>
        ) : evidenceItems.length === 0 ? (
          <div className="p-5"><EmptyState icon={FilePlus2} title="No evidence yet" description="Add the first evidence item for this project." /></div>
        ) : filteredItems.length === 0 ? (
          <div className="p-5"><EmptyState icon={Search} title="No matching evidence" description="Change or clear the search and filters to see evidence." /></div>
        ) : (
          <DataTable columns={columns} rows={filteredItems} getKey={(item) => item.id} />
        )}
      </Card>

      {dialogItem !== undefined && activeProjectId ? (
        <EvidenceDialog
          item={dialogItem}
          controls={controls}
          desktopMode={desktopMode}
          onClose={() => setDialogItem(undefined)}
          onSubmit={(form, selectedFile) => {
            void handleEvidenceSubmit(form, selectedFile)
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
      <select className={`${inputClass} h-9 w-auto min-w-44 py-0 normal-case tracking-normal`} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

function EvidenceDialog({
  item,
  controls,
  desktopMode,
  onClose,
  onSubmit,
}: {
  item: EvidenceItem | null
  controls: Control[]
  desktopMode: boolean
  onClose: () => void
  onSubmit: (form: EvidenceForm, selectedFile: SelectedEvidenceFile | null) => void
}) {
  const [form, setForm] = useState<EvidenceForm>(() => item ? {
    title: item.title,
    description: item.description ?? '',
    category: item.category,
    status: item.status,
    owner: item.owner ?? '',
    evidenceDate: item.evidenceDate ?? '',
    fileName: item.fileName ?? '',
    fileType: item.fileType ?? '',
    fileSize: item.fileSize?.toString() ?? '',
    localPath: item.localPath ?? '',
    notes: item.notes ?? '',
    linkedControlIds: item.linkedControlIds,
  } : emptyForm)
  const [selectedFile, setSelectedFile] = useState<SelectedEvidenceFile | null>(null)
  const [errors, setErrors] = useState<{ title?: string; fileSize?: string }>({})
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateField = <Key extends keyof EvidenceForm>(field: Key, value: EvidenceForm[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'title' || field === 'fileSize') {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleSelectFile = async () => {
    const file = await selectEvidenceFile()
    if (!file) return

    setSelectedFile(file)
    updateField('fileName', file.fileName)
    updateField('fileType', file.fileType)
    updateField('fileSize', String(file.fileSize))
    if (file.sourcePath) updateField('localPath', file.sourcePath)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (form.fileSize !== '' && (!Number.isFinite(Number(form.fileSize)) || Number(form.fileSize) < 0)) {
      nextErrors.fileSize = 'File size must be a non-negative number.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSubmit(form, selectedFile)
  }

  const toggleControl = (controlId: string) => {
    updateField(
      'linkedControlIds',
      form.linkedControlIds.includes(controlId)
        ? form.linkedControlIds.filter((id) => id !== controlId)
        : [...form.linkedControlIds, controlId],
    )
  }

  const destinationFolder = EVIDENCE_CATEGORY_FOLDERS[form.category]

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="evidence-dialog-title" className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="evidence-dialog-title" className="font-semibold text-slate-100">{item ? 'Edit evidence' : 'Add evidence'}</h2>
            <p className="mt-1 text-xs text-slate-500">Record evidence details, attach a real file, and link applicable controls.</p>
          </div>
          <Button variant="ghost" className="size-9 px-0" onClick={onClose} aria-label="Close evidence dialog"><X size={18} aria-hidden="true" /></Button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-h-[calc(92vh-132px)] overflow-y-auto">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="evidence-title" label="Title" required error={errors.title}>
                  <input ref={titleRef} id="evidence-title" className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'evidence-title-error' : undefined} />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="evidence-description" label="Description">
                  <textarea id="evidence-description" className={`${inputClass} min-h-20 resize-y py-2.5`} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                </FormField>
              </div>
              <FormField id="evidence-category" label="Category">
                <select id="evidence-category" className={inputClass} value={form.category} onChange={(event) => updateField('category', event.target.value as EvidenceCategory)}>
                  {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                </select>
              </FormField>
              <FormField id="evidence-status" label="Status">
                <select id="evidence-status" className={inputClass} value={form.status} onChange={(event) => updateField('status', event.target.value as EvidenceStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
              </FormField>
              <FormField id="evidence-owner" label="Owner">
                <input id="evidence-owner" className={inputClass} value={form.owner} onChange={(event) => updateField('owner', event.target.value)} />
              </FormField>
              <FormField id="evidence-date" label="Evidence date">
                <input id="evidence-date" type="date" className={inputClass} value={form.evidenceDate} onChange={(event) => updateField('evidenceDate', event.target.value)} />
              </FormField>

              <div className="sm:col-span-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Evidence file</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {desktopMode
                        ? 'Select a local file to copy into the project pack folder on save.'
                        : 'Browser mode: file metadata only. Run the desktop app to copy real files.'}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" icon={Upload} onClick={() => void handleSelectFile()}>
                    Select file
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <FileDetail label="File name" value={form.fileName || '—'} />
                  <FileDetail label="File type" value={form.fileType || '—'} />
                  <FileDetail label="File size" value={form.fileSize ? `${Number(form.fileSize).toLocaleString()} bytes` : '—'} />
                  <FileDetail label="Destination category" value={`evidence/${destinationFolder}/`} />
                  <div className="sm:col-span-2">
                    <FileDetail label="Selected local path" value={(selectedFile?.sourcePath ?? form.localPath) || '—'} mono />
                  </div>
                </div>
              </div>

              {!desktopMode ? (
                <>
                  <FormField id="evidence-file-name" label="File name (manual)">
                    <input id="evidence-file-name" className={inputClass} value={form.fileName} onChange={(event) => updateField('fileName', event.target.value)} />
                  </FormField>
                  <FormField id="evidence-file-type" label="File type (manual)">
                    <input id="evidence-file-type" className={inputClass} value={form.fileType} onChange={(event) => updateField('fileType', event.target.value)} placeholder="e.g. PDF, CSV" />
                  </FormField>
                  <FormField id="evidence-file-size" label="File size (bytes)" error={errors.fileSize}>
                    <input id="evidence-file-size" type="number" min="0" step="1" className={inputClass} value={form.fileSize} onChange={(event) => updateField('fileSize', event.target.value)} aria-invalid={Boolean(errors.fileSize)} aria-describedby={errors.fileSize ? 'evidence-file-size-error' : undefined} />
                  </FormField>
                  <FormField id="evidence-local-path" label="Local path (manual)">
                    <input id="evidence-local-path" className={inputClass} value={form.localPath} onChange={(event) => updateField('localPath', event.target.value)} />
                  </FormField>
                </>
              ) : null}

              <div className="sm:col-span-2">
                <FormField id="evidence-notes" label="Notes">
                  <textarea id="evidence-notes" className={`${inputClass} min-h-20 resize-y py-2.5`} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
                </FormField>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-medium text-slate-400">Linked controls</legend>
                {controls.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">This project has no controls to link.</p>
                ) : (
                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-3 sm:grid-cols-2">
                    {controls.map((control) => (
                      <label key={control.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-slate-300 hover:bg-slate-800">
                        <input type="checkbox" className="mt-0.5 size-4 accent-cyan-400" checked={form.linkedControlIds.includes(control.id)} onChange={() => toggleControl(control.id)} />
                        <span>{control.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{item ? 'Save changes' : 'Add evidence'}</Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FileDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-1 text-sm text-slate-300 ${mono ? 'break-all font-mono text-xs' : ''}`}>{value}</p>
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
