import { Archive, Download, FileSpreadsheet, FileText, FolderArchive, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card } from '../../shared/components'

const exportOptions = [
  { title: 'Export PDF report', description: 'Formatted report with evidence coverage, gaps, risks, and recommendations.', format: 'PDF', icon: FileText },
  { title: 'Export DOCX report', description: 'Editable report for consultant review and client-specific wording.', format: 'DOCX', icon: FileText },
  { title: 'Export ZIP evidence pack', description: 'Report, evidence index, original files, and gap summary organized by category.', format: 'ZIP', icon: FolderArchive },
  { title: 'Export CSV evidence index', description: 'Evidence metadata, linked controls, owners, dates, and file names.', format: 'CSV', icon: FileSpreadsheet },
  { title: 'Export gap summary', description: 'Open gaps, severity, related controls, and recommendations.', format: 'CSV', icon: TriangleAlert },
]

const zipFiles = [
  ['/', 'report.pdf'],
  ['/', 'evidence-index.csv'],
  ['/01-access-control/', 'mfa-admin-screenshot.png'],
  ['/02-backups/', 'backup-policy.pdf'],
  ['/02-backups/', 'restore-test-screenshot.png'],
  ['/03-assets/', 'asset-inventory.csv'],
  ['/04-incident-response/', 'incident-response-plan.docx'],
] as const

export function ExportPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3">
        {exportOptions.map(({ title, description, format, icon: Icon }, index) => (
          <Card key={title} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-300"><Icon size={18} /></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-200">{title}</h2><Badge tone={index === 2 ? 'cyan' : 'slate'}>{format}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
            <Button variant={index === 2 ? 'primary' : 'secondary'} icon={Download} disabled title="Export generation is coming soon">Export</Button>
          </Card>
        ))}
      </div>
      <Card className="h-fit">
        <div className="border-b border-slate-800 px-5 py-4"><div className="flex items-center gap-2"><Archive size={17} className="text-cyan-300" /><h2 className="font-semibold text-slate-100">ZIP package preview</h2></div><p className="mt-1 text-xs text-slate-500">ACME_security_evidence_pack.zip · est. 18.4 MB</p></div>
        <div className="space-y-1 p-3 font-mono text-xs">
          {zipFiles.map(([folder, file]) => <div key={`${folder}${file}`} className="flex gap-2 rounded px-2 py-2 hover:bg-slate-800/40"><span className="shrink-0 text-cyan-700">{folder}</span><span className="truncate text-slate-400">{file}</span></div>)}
        </div>
        <div className="border-t border-slate-800 p-4 text-xs leading-5 text-slate-500">
          Exports are generated locally. Review included files for sensitive information before sharing.
        </div>
      </Card>
    </div>
  )
}
