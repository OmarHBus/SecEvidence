import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ExternalLink, FilePlus2, FileSearch, Pencil, Search, Trash2, Upload } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  DialogBody,
  DialogDetail,
  dialogCheckboxGridClass,
  dialogCheckboxLabelClass,
  dialogEmptyHintClass,
  dialogInsetPanelClass,
  dialogLegendClass,
  EmptyState,
  ActionGroup,
  IconButton,
  FormField,
  inputClass,
  type Column,
} from '../../shared/components'
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

    if (selectedFile?.sourcePath && !settings.localEvidencePackRootFolder.trim()) {
      window.alert('Set a local evidence pack folder in Settings before attaching real files.')
      return
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
      } else {
        window.alert('Could not copy the selected file into the evidence pack folder. Check the folder path and try again.')
        return
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
      header: 'Evidence',
      width: '32%',
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100" title={item.title}>{item.title}</p>
          {item.description ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500" title={item.description}>{item.description}</p>
          ) : null}
          {item.fileName ? (
            <p className="mt-1 truncate text-[11px] text-zinc-600" title={item.fileName}>
              {[item.fileName, item.fileType, item.fileSize !== undefined ? `${item.fileSize.toLocaleString()} B` : undefined].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {item.notes ? (
            <p className="mt-0.5 truncate text-[11px] italic text-zinc-600" title={item.notes}>{item.notes}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '14%',
      render: (item) => (
        <span className="block truncate text-xs text-zinc-400" title={categoryLabels[item.category]}>
          {categoryLabels[item.category]}
        </span>
      ),
    },
    {
      key: 'control',
      header: 'Control',
      width: '18%',
      render: (item) => {
        const linked = item.linkedControlIds.map((id) => controlNames.get(id) ?? id).join(', ') || '—'
        return <span className="block truncate text-xs text-zinc-400" title={linked}>{linked}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (item) => <Badge tone={toneByStatus[item.status]}>{statusLabels[item.status]}</Badge>,
    },
    {
      key: 'meta',
      header: 'Owner / date',
      width: '14%',
      render: (item) => (
        <div className="min-w-0 text-xs">
          <p className="truncate text-zinc-400" title={item.owner ?? undefined}>{item.owner ?? '—'}</p>
          <p className="mt-0.5 text-zinc-600">{formatDate(item.evidenceDate)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '96px',
      align: 'right',
      hideHeader: true,
      render: (item) => (
        <ActionGroup>
          {item.localPath && desktopMode ? (
            <IconButton
              icon={ExternalLink}
              label={`Reveal ${item.title} file`}
              variant="accent"
              onClick={() => void revealEvidenceFile(item.localPath!)}
            />
          ) : null}
          <IconButton icon={Pencil} label={`Edit ${item.title}`} variant="edit" onClick={() => setDialogItem(item)} />
          <IconButton
            icon={Trash2}
            label={`Delete ${item.title}`}
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete evidence "${item.title}"?`)) deleteEvidence(item.id)
            }}
          />
        </ActionGroup>
      ),
    },
  ]

  const hasFilters = Boolean(search.trim()) || statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-white/[0.07] bg-zinc-900/50 px-3 text-sm text-zinc-500 transition focus-within:border-teal-500/30 focus-within:ring-2 focus-within:ring-teal-500/10 xl:max-w-md">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search evidence</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, owner, file, notes…"
            className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </label>
        <Button icon={FilePlus2} disabled={!activeProjectId} onClick={() => setDialogItem(null)}>Add evidence</Button>
      </div>

      {!settings.localEvidencePackRootFolder.trim() ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
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
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 text-xs text-zinc-500">
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
    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
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
  }, [])

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
    <Dialog
      titleId="evidence-dialog-title"
      title={item ? 'Edit evidence' : 'Add evidence'}
      description="Record evidence details, attach a real file, and link applicable controls."
      onClose={onClose}
      maxWidth="xl"
      onSubmit={handleSubmit}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{item ? 'Save changes' : 'Add evidence'}</Button>
        </>
      )}
    >
      <DialogBody>
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

        <div className={`sm:col-span-2 p-4 ${dialogInsetPanelClass}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-zinc-200">Evidence file</p>
              <p className="mt-1 text-xs text-zinc-500">
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
            <DialogDetail label="File name" value={form.fileName || '—'} />
            <DialogDetail label="File type" value={form.fileType || '—'} />
            <DialogDetail label="File size" value={form.fileSize ? `${Number(form.fileSize).toLocaleString()} bytes` : '—'} />
            <DialogDetail label="Destination category" value={`evidence/${destinationFolder}/`} />
            <div className="sm:col-span-2">
              <DialogDetail label="Selected local path" value={(selectedFile?.sourcePath ?? form.localPath) || '—'} mono />
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
          <legend className={dialogLegendClass}>Linked controls</legend>
          {controls.length === 0 ? (
            <p className={dialogEmptyHintClass}>This project has no controls to link.</p>
          ) : (
            <div className={dialogCheckboxGridClass}>
              {controls.map((control) => (
                <label key={control.id} className={dialogCheckboxLabelClass}>
                  <input type="checkbox" className="mt-0.5 size-4 accent-teal-400" checked={form.linkedControlIds.includes(control.id)} onChange={() => toggleControl(control.id)} />
                  <span>{control.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </DialogBody>
    </Dialog>
  )
}
