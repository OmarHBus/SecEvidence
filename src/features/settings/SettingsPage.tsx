import { Database, FolderOpen, HardDrive, Info, Save } from 'lucide-react'
import { Button, Card } from '../../shared/components'

export function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-5">
      <Card>
        <div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-slate-100">Workspace settings</h2><p className="mt-1 text-xs text-slate-500">Defaults for the active project.</p></div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Company / consultant name" value="SecEvidence Consulting" />
          <Field label="Report branding" value="SecEvidence standard" />
          <Field label="Export preferences" value="Include evidence index and gap summary" />
          <Field label="Default export folder" value="D:\SecEvidence\exports" icon={FolderOpen} />
          <div className="sm:col-span-2"><Field label="Local project storage path" value="D:\SecEvidence\workspace\acme-security-review-2026" icon={FolderOpen} /></div>
        </div>
        <div className="flex justify-end border-t border-slate-800 px-5 py-4"><Button icon={Save} disabled title="Settings persistence is coming soon">Save changes · Coming soon</Button></div>
      </Card>

      <Card>
        <div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-slate-100">Local storage</h2><p className="mt-1 text-xs text-slate-500">Storage adapters are prepared but not connected in this web iteration.</p></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <StorageItem icon={Database} label="Project database" detail="SQLite schema stub · Not initialized" />
          <StorageItem icon={HardDrive} label="Evidence files" detail="Local file adapter · Not initialized" />
        </div>
      </Card>

      <div className="flex gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <Info className="mt-0.5 shrink-0 text-cyan-300" size={18} />
        <div><p className="text-sm font-semibold text-cyan-200">Local-first</p><p className="mt-1 text-sm leading-6 text-slate-400">Your evidence files stay on this device unless you explicitly export or move them.</p></div>
      </div>
    </div>
  )
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof FolderOpen }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-slate-400">{label}</span><div className="flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300">{Icon ? <Icon size={15} className="text-slate-500" /> : null}<input className="min-w-0 flex-1 bg-transparent outline-none" defaultValue={value} /></div></label>
}

function StorageItem({ icon: Icon, label, detail }: { icon: typeof Database; label: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4"><div className="grid size-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><Icon size={17} /></div><div><p className="text-sm text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>
}
