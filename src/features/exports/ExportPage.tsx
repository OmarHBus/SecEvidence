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
import { exportPdfReport } from '../../storage/exports/pdf-export'
import { exportEvidencePackZip } from '../../storage/exports/zip-export'
import { EVIDENCE_CATEGORY_FOLDERS } from '../../storage/files/file-types'

const upcomingExportOptions = [
  {
    title: 'Export DOCX report',
    description: 'Editable report for consultant review and client-specific wording.',
    format: 'DOCX',
    icon: FileText,
    message: 'DOCX export is not available yet.',
  },
]

type Feedback = {
  message: string
  tone: 'success' | 'error' | 'neutral'
}

export function ExportPage() {
  const { activeProject, evidenceItems, controls, risks, settings, stats } = useAppData()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingZip, setExportingZip] = useState(false)
  const canExport = activeProject !== undefined
  const prefix = settings.defaultExportPrefix.trim() || 'secevidence'
  const zipPreviewName = activeProject ? buildZipExportName(activeProject.clientName) : 'security_evidence_pack.zip'

  const zipPreviewFiles = useMemo(() => {
    const files: Array<[string, string]> = [
      ['/', 'report.pdf'],
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
    setFeedback({ message: `Downloaded ${fileName}`, tone: 'success' })
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
    setFeedback({ message: `Downloaded ${prefix}-report.md`, tone: 'success' })
  }

  const handlePdfExport = async () => {
    if (!activeProject) return

    const fileName = `${prefix}-report.pdf`
    setExportingPdf(true)
    setFeedback(null)
    try {
      const { delivery } = await exportPdfReport({
        project: activeProject,
        evidenceItems,
        controls,
        risks,
        stats,
        settings,
      }, fileName)

      if (delivery === 'cancelled') {
        setFeedback({ message: 'PDF export cancelled.', tone: 'neutral' })
        return
      }

      setFeedback({
        message: `${delivery === 'saved' ? 'Saved' : 'Downloaded'} ${fileName}`,
        tone: 'success',
      })
    } catch {
      setFeedback({
        message: 'PDF export failed. No file was created. Please try again.',
        tone: 'error',
      })
    } finally {
      setExportingPdf(false)
    }
  }

  const handleZipExport = async () => {
    if (!activeProject) return

    setExportingZip(true)
    setFeedback(null)
    try {
      const { result, delivery } = await exportEvidencePackZip({
        project: activeProject,
        evidenceItems,
        controls,
        risks,
        stats,
        settings,
      })

      if (delivery === 'cancelled') {
        setFeedback({ message: 'ZIP export cancelled.', tone: 'neutral' })
        return
      }

      const skippedNote = result.skippedEvidenceFiles > 0
        ? ` (${result.skippedEvidenceFiles} evidence file(s) skipped)`
        : ''
      const action = delivery === 'saved' ? 'Saved' : 'Downloaded'
      setFeedback({
        message: `${action} ${result.fileName} with ${result.includedEvidenceFiles} evidence file(s)${skippedNote}`,
        tone: 'success',
      })
    } catch {
      setFeedback({
        message: 'ZIP export failed. Try again or export CSVs individually.',
        tone: 'error',
      })
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
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 text-teal-300"><Icon size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-200">{title}</h2><Badge tone="cyan">CSV</Badge></div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-zinc-600">{fileName}</p>
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
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 text-teal-300"><FileText size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-200">Export PDF report</h2><Badge tone="green">PDF</Badge></div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Print-ready report with executive summary, controls, evidence, open gaps, appendix, and disclaimer.</p>
            <p className="mt-1 truncate font-mono text-[11px] text-zinc-600">{prefix}-report.pdf</p>
          </div>
          <Button variant="primary" icon={Download} disabled={!canExport || exportingPdf} onClick={() => void handlePdfExport()}>
            {exportingPdf ? 'Building PDF…' : 'Export PDF'}
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 text-teal-300"><FileText size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-200">Export Markdown report</h2><Badge tone="cyan">MD</Badge></div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Executive summary, control coverage, gaps, risks, and evidence appendix.</p>
            <p className="mt-1 truncate font-mono text-[11px] text-zinc-600">{prefix}-report.md</p>
          </div>
          <Button variant="primary" icon={Download} disabled={!canExport} onClick={handleMarkdownPreview}>
            Download MD
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 text-teal-300"><FolderArchive size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-200">Export ZIP evidence pack</h2><Badge tone="green">ZIP</Badge></div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">PDF and Markdown reports, CSVs, and evidence files organized by category.</p>
            <p className="mt-1 truncate font-mono text-[11px] text-zinc-600">{zipPreviewName}</p>
          </div>
          <Button variant="primary" icon={Download} disabled={!canExport || exportingZip} onClick={() => void handleZipExport()}>
            {exportingZip ? 'Building ZIP…' : 'Download ZIP'}
          </Button>
        </Card>

        {upcomingExportOptions.map(({ title, description, format, icon: Icon, message }) => (
          <Card key={title} className="flex flex-col gap-4 p-4 opacity-75 sm:flex-row sm:items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400"><Icon size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-300">{title}</h2><Badge>{format}</Badge></div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
              <p className="mt-1 text-xs text-amber-300">{message}</p>
            </div>
            <Button variant="secondary" icon={Download} disabled title={message}>Coming soon</Button>
          </Card>
        ))}

        {feedback ? (
          <p
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            className={`px-1 text-xs ${
              feedback.tone === 'error'
                ? 'text-rose-300'
                : feedback.tone === 'neutral'
                  ? 'text-zinc-400'
                  : 'text-emerald-300'
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
      <Card className="h-fit">
        <div className="border-b border-zinc-800 px-5 py-4"><div className="flex items-center gap-2"><Archive size={17} className="text-teal-300" /><h2 className="font-semibold text-zinc-100">ZIP package preview</h2></div><p className="mt-1 text-xs text-zinc-500">{zipPreviewName}</p></div>
        <div className="space-y-1 p-3 font-mono text-xs">
          {zipPreviewFiles.map(([folder, file]) => <div key={`${folder}${file}`} className="flex gap-2 rounded px-2 py-2 hover:bg-zinc-800/40"><span className="shrink-0 text-teal-700">{folder}</span><span className="truncate text-zinc-400">{file}</span></div>)}
        </div>
        <div className="border-t border-zinc-800 p-4 text-xs leading-5 text-zinc-500">
          Exports are generated locally. Evidence files are included when copied into the project pack via the desktop app.
        </div>
      </Card>
    </div>
  )
}
