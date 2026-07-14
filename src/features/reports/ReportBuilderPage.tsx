import { Check, FileText, GripVertical, Info } from 'lucide-react'
import { useState } from 'react'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Button, Card, EmptyState, ProgressBar } from '../../shared/components'
import type { ReportSection } from '../../shared/types'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'
import { exportPdfReport } from '../../storage/exports/pdf-export'

const sections: ReportSection[] = [
  { id: 'executive-summary', title: 'Executive Summary', description: 'Readiness, key findings, and priorities.', included: true },
  { id: 'control-coverage', title: 'Control Coverage', description: 'Coverage status for each security control.', included: true },
  { id: 'open-gaps', title: 'Open Gaps', description: 'Unresolved control and evidence gaps.', included: true },
  { id: 'appendix', title: 'Evidence Appendix', description: 'Detailed evidence index and file references.', included: true },
]

export function ReportBuilderPage() {
  const { activeProject, evidenceItems, controls, risks, settings, stats } = useAppData()
  const [included, setIncluded] = useState<Set<string>>(() => new Set(sections.map((section) => section.id)))
  const [exportingPdf, setExportingPdf] = useState(false)
  const [pdfFeedback, setPdfFeedback] = useState('')
  const toggle = (id: string) => setIncluded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const handlePdfExport = async () => {
    if (!activeProject) return

    const prefix = settings.defaultExportPrefix.trim() || 'secevidence'
    const fileName = `${prefix}-report.pdf`
    setExportingPdf(true)
    setPdfFeedback('')
    try {
      const { delivery } = await exportPdfReport({
        project: activeProject,
        evidenceItems,
        controls,
        risks,
        stats,
        settings,
      }, fileName)
      setPdfFeedback(delivery === 'cancelled'
        ? 'PDF export cancelled.'
        : `${delivery === 'saved' ? 'Saved' : 'Downloaded'} ${fileName}`)
    } catch {
      setPdfFeedback('PDF export failed. No file was created. Please try again.')
    } finally {
      setExportingPdf(false)
    }
  }

  if (!activeProject) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={FileText}
          title="No active project"
          description="Select or create a project before building a report."
        />
      </Card>
    )
  }

  const openGaps = risks.filter((risk) => risk.status === 'open' || risk.status === 'in_progress')
  const generatedOn = formatDate(new Date().toISOString())

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Card>
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <h2 className="font-semibold text-zinc-100">Report sections</h2>
              <p className="mt-1 text-xs text-zinc-500">Select content for the security evidence report preview.</p>
            </div>
            <Badge tone="slate">{included.size} selected</Badge>
          </div>
          <div className="divide-y divide-zinc-800 p-2">
            {sections.map((section) => {
              const selected = included.has(section.id)
              return (
                <div key={section.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-zinc-800/25">
                  <GripVertical className="shrink-0 text-zinc-700" size={17} aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Exclude' : 'Include'} ${section.title}`}
                    className={`grid size-5 shrink-0 place-items-center rounded border ${selected ? 'border-teal-400 bg-teal-400 text-zinc-950' : 'border-zinc-600 bg-zinc-900'}`}
                  >
                    {selected ? <Check size={13} aria-hidden="true" /> : null}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{section.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{section.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-950/40 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-400">Security evidence report preview</p>
                <h1 className="mt-2 text-xl font-semibold text-zinc-100">{activeProject.projectName}</h1>
                <p className="mt-1 text-sm text-zinc-400">{activeProject.clientName} · {activeProject.packType}</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>Report date</p>
                <p className="mt-1 font-medium text-zinc-300">{generatedOn}</p>
              </div>
            </div>
          </div>

          {included.size === 0 ? (
            <div className="p-6">
              <EmptyState icon={FileText} title="No report sections selected" description="Select at least one section to build the report preview." />
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {included.has('executive-summary') ? (
                <ReportPreviewSection title="Executive Summary">
                  <p>
                    {activeProject.clientName}'s {activeProject.packType} evidence pack is currently {stats.readinessPercent}% ready,
                    with {stats.controlsCovered} of {stats.applicableControls} applicable controls covered. The review includes
                    {' '}{stats.totalEvidence} evidence {stats.totalEvidence === 1 ? 'item' : 'items'} and identifies {stats.openGaps}
                    {' '}{stats.openGaps === 1 ? 'open gap' : 'open gaps'}, including {stats.highCriticalGaps} high or critical
                    {stats.highCriticalGaps === 1 ? ' priority' : ' priorities'}. Remediation should focus on unresolved high-impact
                    gaps and evidence awaiting review or renewal before the pack is submitted for professional assessment.
                  </p>
                </ReportPreviewSection>
              ) : null}

              {included.has('control-coverage') ? (
                <ReportPreviewSection title="Control Coverage">
                  {controls.length === 0 ? (
                    <PreviewEmpty>No controls have been added to this project.</PreviewEmpty>
                  ) : (
                    <div className="space-y-2">
                      {controls.map((control) => (
                        <div key={control.id} className="flex flex-col justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/35 px-3 py-2.5 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{control.name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{categoryLabels[control.category]} · {control.linkedEvidenceIds.length} linked evidence</p>
                          </div>
                          <Badge tone={control.status === 'covered' ? 'green' : control.status === 'not_applicable' ? 'slate' : control.status === 'gap' ? 'red' : 'amber'}>
                            {control.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ReportPreviewSection>
              ) : null}

              {included.has('open-gaps') ? (
                <ReportPreviewSection title="Open Gaps">
                  {openGaps.length === 0 ? (
                    <PreviewEmpty>No open or in-progress gaps are recorded.</PreviewEmpty>
                  ) : (
                    <div className="space-y-3">
                      {openGaps.map((risk) => (
                        <div key={risk.id} className="rounded-lg border border-zinc-800 bg-zinc-950/35 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="mr-auto text-sm font-medium text-zinc-200">{risk.title}</p>
                            <Badge tone={risk.severity === 'high' || risk.severity === 'critical' ? 'red' : risk.severity === 'medium' ? 'amber' : 'slate'}>{risk.severity}</Badge>
                            <Badge tone={risk.status === 'open' ? 'red' : 'amber'}>{risk.status.replace('_', ' ')}</Badge>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-zinc-500">{risk.description}</p>
                          {risk.recommendation ? <p className="mt-2 text-xs leading-5 text-zinc-400"><span className="font-medium text-zinc-300">Recommendation:</span> {risk.recommendation}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </ReportPreviewSection>
              ) : null}

              {included.has('appendix') ? (
                <ReportPreviewSection title="Evidence Appendix">
                  {evidenceItems.length === 0 ? (
                    <PreviewEmpty>No evidence has been added to this project.</PreviewEmpty>
                  ) : (
                    <div className="space-y-2">
                      {evidenceItems.map((item, index) => (
                        <div key={item.id} className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/35 px-3 py-2.5 text-xs sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center">
                          <span className="text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-200">{item.title}</p>
                            <p className="mt-0.5 text-zinc-500">{categoryLabels[item.category]} · {item.fileName ?? 'No file attached'} · Evidence date {formatDate(item.evidenceDate)}</p>
                          </div>
                          <Badge tone={item.status === 'accepted' ? 'green' : item.status === 'needs_review' ? 'amber' : 'red'}>{statusLabels[item.status]}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ReportPreviewSection>
              ) : null}
            </div>
          )}

          <div className="border-t border-zinc-800 bg-zinc-950/30 px-6 py-4 text-xs leading-5 text-zinc-500">
            {settings.reportFooterText ? <p className="mb-2 text-zinc-400">{settings.reportFooterText}</p> : null}
            This report helps organize evidence and does not guarantee compliance or replace professional auditing or legal advice.
          </div>
        </Card>
      </div>

      <aside>
        <Card className="h-fit p-5 xl:sticky xl:top-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-100">Report readiness</h2>
            <span className="text-2xl font-semibold text-teal-300">{stats.readinessPercent}%</span>
          </div>
          <div className="mt-4"><ProgressBar value={stats.readinessPercent} /></div>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Controls covered" value={`${stats.controlsCovered} / ${stats.applicableControls}`} />
            <Row label="Evidence collected" value={String(stats.totalEvidence)} />
            <Row label="Open gaps" value={String(stats.openGaps)} warning={stats.openGaps > 0} />
            <Row label="High-risk gaps" value={String(stats.highCriticalGaps)} warning={stats.highCriticalGaps > 0} />
          </div>
          <Button icon={FileText} className="mt-5 w-full" disabled={exportingPdf} onClick={() => void handlePdfExport()}>
            {exportingPdf ? 'Building PDF…' : 'Export PDF report'}
          </Button>
          <p className="mt-3 flex gap-2 text-xs leading-5 text-zinc-500">
            <Info className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
            The exported PDF includes all required report sections and is also included in the ZIP evidence pack.
          </p>
          {pdfFeedback ? <p role="status" className="mt-3 text-xs text-zinc-400">{pdfFeedback}</p> : null}
        </Card>
      </aside>
    </div>
  )
}

function ReportPreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-zinc-400">{children}</div>
    </section>
  )
}

function PreviewEmpty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">{children}</p>
}

function Row({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="flex items-center justify-between border-b border-zinc-800 pb-3"><span className="text-zinc-400">{label}</span><span className={warning ? 'text-amber-300' : 'text-emerald-300'}>{value}</span></div>
}
