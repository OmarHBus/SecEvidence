import { Archive, Download, FileSpreadsheet, FileText, FolderArchive, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Button, Card } from '../../shared/components'
import { buildZipExportName } from '../../shared/utils/file-names'
import {
  buildControlsCsv,
  buildEvidenceCsv,
  buildRisksCsv,
  downloadCsv,
  downloadText,
} from '../../storage/exports/csv-export'
import { buildMarkdownReport } from '../../storage/exports/markdown-report'
import { exportEvidencePackZip } from '../../storage/exports/zip-export'
import { EVIDENCE_CATEGORY_FOLDERS } from '../../storage/files/file-types'

const upcomingExportOptions = [
  {
    title: 'Export PDF report',
    description: 'Formatted report with evidence coverage, gaps, risks, and recommendations.',
    format: 'PDF',
    icon: FileText,
    message: 'Coming next: PDF export. Markdown report is already included in the ZIP pack.',
  },
  {
    title: 'Export DOCX report',
    description: 'Editable report for consultant review and client-specific wording.',
    format: 'DOCX',
    icon: FileText,
    message: 'DOCX export is not available.',
  },
]

export function ExportPage() {
  const { activeProject, evidenceItems, controls, risks, settings, stats } = useAppData()
  const [feedback, setFeedback] = useState('')
  const [exportingZip, setExportingZip] = useState(false)
  const canExport = activeProject !== undefined
  const prefix = settings.defaultExportPrefix.trim() || 'secevidence'
  const zipPreviewName = activeProject ? buildZipExportName(activeProject.clientName) : 'security_evidence_pack.zip'

  const zipPreviewFiles = useMemo(() => {
    const files: Array<[string, string]> = [
      ['/', 'report.md'],
      ['/', 'evidence-index.csv'],
      ['/', 'controls.csv'],
      ['/', 'risks.csv'],
    ]

    for (const item of evidenceItems) {
      if (!item.fileName) continue
      const folder = EVIDENCE_CATEGORY_FOLDERS[item.category]
      files.push([`/evidence/${folder}/`, item.fileName])
    }

    return files
  }, [evidenceItems])

  const csvExportOptions = [
    {
      title: 'Export CSV evidence index',
      description: 'Evidence metadata, linked control names, owners, dates, and file names.',
      fileName: `${prefix}-evidence-index.csv`,
      icon: FileSpreadsheet,
      build: () => buildEvidenceCsv(evidenceItems, controls),
    },
    {
      title: 'Export CSV controls',
      description: 'Control status, risk level, evidence coverage, owners, and notes.',
      fileName: `${prefix}-controls.csv`,
      icon: FileSpreadsheet,
      build: () => buildControlsCsv(controls),
    },
    {
      title: 'Export CSV risks',
      description: 'Risks, severity, related control names, recommendations, and descriptions.',
      fileName: `${prefix}-risks.csv`,
      icon: TriangleAlert,
      build: () => buildRisksCsv(risks, controls),
    },
  ]

  const handleCsvExport = (fileName: string, build: () => string) => {
    downloadCsv(build(), fileName)
    setFeedback(`Downloaded ${fileName}`)
  }

  const handleMarkdownPreview = () => {
    if (!activeProject) return
    const markdown = buildMarkdownReport({
      project: activeProject,
      evidenceItems,
      controls,
      risks,
      stats,
      settings,
    })
    downloadText(markdown, `${prefix}-report.md`, 'text/markdown;charset=utf-8')
    setFeedback(`Downloaded ${prefix}-report.md`)
  }

  const handleZipExport = async () => {
    if (!activeProject) return

    setExportingZip(true)
    try {
      const result = await exportEvidencePackZip({
        project: activeProject,
        evidenceItems,
        controls,
        risks,
        stats,
        settings,
      })
      const skippedNote = result.skippedEvidenceFiles > 0
        ? ` (${result.skippedEvidenceFiles} evidence file(s) skipped — desktop copy required)`
        : ''
      setFeedback(`Downloaded ${result.fileName} with ${result.includedEvidenceFiles} evidence file(s)${skippedNote}`)
    } catch {
      setFeedback('ZIP export failed. Try again or export CSVs individually.')
    } finally {
      setExportingZip(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3">
        {!canExport ? (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Select or create a project before exporting files.
          </div>
        ) : null}

        {csvExportOptions.map(({ title, description, fileName, icon: Icon, build }) => (
          <Card key={title} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-300"><Icon size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-200">{title}</h2><Badge tone="cyan">CSV</Badge></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-slate-600">{fileName}</p>
            </div>
            <Button
              variant="primary"
              icon={Download}
              disabled={!canExport}
              onClick={() => handleCsvExport(fileName, build)}
              aria-label={`Download ${title}`}
            >
              Download CSV
            </Button>
          </Card>
        ))}

        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-300"><FileText size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-200">Export Markdown report</h2><Badge tone="cyan">MD</Badge></div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Executive summary, control coverage, gaps, risks, and evidence appendix.</p>
            <p className="mt-1 truncate font-mono text-[11px] text-slate-600">{prefix}-report.md</p>
          </div>
          <Button variant="primary" icon={Download} disabled={!canExport} onClick={handleMarkdownPreview}>
            Download MD
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-300"><FolderArchive size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-200">Export ZIP evidence pack</h2><Badge tone="green">ZIP</Badge></div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Report, CSVs, and evidence files organized by category.</p>
            <p className="mt-1 truncate font-mono text-[11px] text-slate-600">{zipPreviewName}</p>
          </div>
          <Button variant="primary" icon={Download} disabled={!canExport || exportingZip} onClick={() => void handleZipExport()}>
            {exportingZip ? 'Building ZIP…' : 'Download ZIP'}
          </Button>
        </Card>

        {upcomingExportOptions.map(({ title, description, format, icon: Icon, message }) => (
          <Card key={title} className="flex flex-col gap-4 p-4 opacity-75 sm:flex-row sm:items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400"><Icon size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-slate-300">{title}</h2><Badge>{format}</Badge></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              <p className="mt-1 text-xs text-amber-300">{message}</p>
            </div>
            <Button variant="secondary" icon={Download} disabled title={message}>Coming soon</Button>
          </Card>
        ))}

        {feedback ? (
          <p role="status" className="px-1 text-xs text-emerald-300">{feedback}</p>
        ) : null}
      </div>
      <Card className="h-fit">
        <div className="border-b border-slate-800 px-5 py-4"><div className="flex items-center gap-2"><Archive size={17} className="text-cyan-300" /><h2 className="font-semibold text-slate-100">ZIP package preview</h2></div><p className="mt-1 text-xs text-slate-500">{zipPreviewName}</p></div>
        <div className="space-y-1 p-3 font-mono text-xs">
          {zipPreviewFiles.map(([folder, file]) => <div key={`${folder}${file}`} className="flex gap-2 rounded px-2 py-2 hover:bg-slate-800/40"><span className="shrink-0 text-cyan-700">{folder}</span><span className="truncate text-slate-400">{file}</span></div>)}
        </div>
        <div className="border-t border-slate-800 p-4 text-xs leading-5 text-slate-500">
          Exports are generated locally. Evidence files are included when copied into the project pack via the desktop app.
        </div>
      </Card>
    </div>
  )
}
