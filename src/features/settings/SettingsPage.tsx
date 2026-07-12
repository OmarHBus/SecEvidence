import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FolderOpen, FolderTree, Info, Save } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import { Button, Card } from '../../shared/components'
import type { AppSettings } from '../../shared/types'
import { ensureProjectPackFolder, openPath, selectFolder } from '../../storage/files/local-project-folder'
import { isDesktopApp } from '../../storage/files/tauri-env'

export function SettingsPage() {
  const { settings, updateSettings, activeProject, updateProject } = useAppData()
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [desktopMode, setDesktopMode] = useState(false)
  const [folderFeedback, setFolderFeedback] = useState('')

  useEffect(() => {
    setForm(settings)
  }, [settings])

  useEffect(() => {
    void isDesktopApp().then(setDesktopMode)
  }, [])

  const updateField = <Key extends keyof AppSettings>(field: Key, value: AppSettings[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateSettings(form)
    setSaved(true)
  }

  const handleSelectRootFolder = async () => {
    const selected = await selectFolder('Select local evidence pack root folder')
    if (!selected) return
    const nextForm = { ...form, localEvidencePackRootFolder: selected }
    setForm(nextForm)
    updateSettings({ localEvidencePackRootFolder: selected })
    setSaved(true)
    setFolderFeedback(`Root folder set to ${selected}`)
  }

  const handleSelectExportFolder = async () => {
    const selected = await selectFolder('Select export folder')
    if (!selected) return
    const nextForm = { ...form, exportFolder: selected }
    setForm(nextForm)
    updateSettings({ exportFolder: selected })
    setSaved(true)
    setFolderFeedback(`Export folder set to ${selected}`)
  }

  const handleOpenRootFolder = async () => {
    if (!form.localEvidencePackRootFolder.trim()) {
      setFolderFeedback('Set a local evidence pack folder first.')
      return
    }
    const opened = await openPath(form.localEvidencePackRootFolder.trim())
    setFolderFeedback(opened ? 'Opened local evidence pack folder.' : 'Could not open folder in this environment.')
  }

  const handleOpenExportFolder = async () => {
    const exportPath = form.exportFolder.trim()
      || (activeProject?.localPackPath ? `${activeProject.localPackPath}/exports` : '')
    if (!exportPath) {
      setFolderFeedback('Set an export folder or initialize a project pack folder first.')
      return
    }
    const opened = await openPath(exportPath)
    setFolderFeedback(opened ? 'Opened export folder.' : 'Could not open folder in this environment.')
  }

  const handleInitializeProjectPack = async () => {
    if (!activeProject || !form.localEvidencePackRootFolder.trim()) {
      setFolderFeedback('Select an active project and set a root folder first.')
      return
    }

    const folderInfo = await ensureProjectPackFolder(
      form.localEvidencePackRootFolder.trim(),
      activeProject.clientName,
    )
    updateProject(activeProject.id, { localPackPath: folderInfo.packFolderPath })
    setFolderFeedback(
      desktopMode
        ? `Project pack folder ready at ${folderInfo.packFolderPath}`
        : `Pack folder path prepared: ${folderInfo.packFolderPath}`,
    )
  }

  return (
    <div className="max-w-4xl space-y-5">
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-slate-100">Workspace settings</h2>
            <p className="mt-1 text-xs text-slate-500">Defaults used when SecEvidence prepares local exports and reports.</p>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Consultant / company name" htmlFor="consultant-company-name">
              <input
                id="consultant-company-name"
                className={inputClass}
                value={form.consultantCompanyName}
                onChange={(event) => updateField('consultantCompanyName', event.target.value)}
              />
            </Field>
            <Field label="Default export prefix" htmlFor="default-export-prefix">
              <input
                id="default-export-prefix"
                className={inputClass}
                value={form.defaultExportPrefix}
                onChange={(event) => updateField('defaultExportPrefix', event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Report footer text" htmlFor="report-footer-text">
                <textarea
                  id="report-footer-text"
                  className={`${inputClass} min-h-24 resize-y py-2.5`}
                  value={form.reportFooterText}
                  onChange={(event) => updateField('reportFooterText', event.target.value)}
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-600 bg-slate-900 accent-cyan-400"
                checked={form.localFirstReminderEnabled}
                onChange={(event) => updateField('localFirstReminderEnabled', event.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">Show local-first reminder</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Keep the local storage notice visible in the workspace.</span>
              </span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-5 py-4">
            <p className="text-xs text-emerald-300" role="status" aria-live="polite">
              {saved ? 'Settings saved locally.' : ''}
            </p>
            <Button type="submit" icon={Save}>Save changes</Button>
          </div>
        </Card>
      </form>

      <Card>
        <div className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderTree size={17} className="text-cyan-300" />
            <h2 className="font-semibold text-slate-100">Local evidence pack folder</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Choose where SecEvidence stores organized evidence files for each project pack.</p>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Local evidence pack root folder" htmlFor="local-pack-root-folder">
            <input
              id="local-pack-root-folder"
              className={inputClass}
              value={form.localEvidencePackRootFolder}
              onChange={(event) => updateField('localEvidencePackRootFolder', event.target.value)}
              placeholder={desktopMode ? 'Select or paste a folder path' : 'Paste a folder path (desktop app required to browse)'}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" icon={FolderOpen} onClick={() => void handleSelectRootFolder()} disabled={!desktopMode}>
              Change folder
            </Button>
            <Button type="button" variant="ghost" onClick={() => void handleOpenRootFolder()} disabled={!form.localEvidencePackRootFolder.trim()}>
              Open folder
            </Button>
            <Button type="button" variant="ghost" onClick={() => void handleInitializeProjectPack()} disabled={!activeProject || !form.localEvidencePackRootFolder.trim()}>
              Initialize active project pack
            </Button>
          </div>
          {activeProject?.localPackPath ? (
            <p className="text-xs text-slate-500">Active project pack: <span className="font-mono text-slate-400">{activeProject.localPackPath}</span></p>
          ) : null}

          <Field label="Export folder (optional)" htmlFor="export-folder">
            <input
              id="export-folder"
              className={inputClass}
              value={form.exportFolder}
              onChange={(event) => updateField('exportFolder', event.target.value)}
              placeholder="Defaults to each project pack /exports"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" icon={FolderOpen} onClick={() => void handleSelectExportFolder()} disabled={!desktopMode}>
              Change export folder
            </Button>
            <Button type="button" variant="ghost" onClick={() => void handleOpenExportFolder()}>
              Open export folder
            </Button>
          </div>

          {!desktopMode ? (
            <p className="text-xs text-amber-300">Folder browsing and file copy require the Tauri desktop app. Browser dev mode keeps manual metadata entry as fallback.</p>
          ) : null}
          {folderFeedback ? <p className="text-xs text-emerald-300" role="status">{folderFeedback}</p> : null}
        </div>
      </Card>

      <div className="flex gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <Info className="mt-0.5 shrink-0 text-cyan-300" size={18} />
        <div>
          <p className="text-sm font-semibold text-cyan-200">Local-first</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">Your evidence files stay on this device unless you explicitly export or move them.</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Project metadata and settings remain in localStorage for now. SQLite migration is planned for a later phase.</p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15'
