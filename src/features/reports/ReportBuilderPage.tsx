import { Check, FileText, GripVertical, Info } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, ProgressBar } from '../../shared/components'
import type { ReportSection } from '../../shared/types'

const sections: ReportSection[] = [
  { id: 'executive-summary', title: 'Executive Summary', description: 'Readiness, key findings, and priorities.', included: true },
  { id: 'scope', title: 'Scope', description: 'Client, systems, period, and pack boundaries.', included: true },
  { id: 'methodology', title: 'Methodology', description: 'How evidence and controls were reviewed.', included: true },
  { id: 'evidence-summary', title: 'Evidence Summary', description: 'Evidence status and category breakdown.', included: true },
  { id: 'control-coverage', title: 'Control Coverage', description: 'Coverage status for each security control.', included: true },
  { id: 'open-gaps', title: 'Open Gaps', description: 'Unresolved control and evidence gaps.', included: true },
  { id: 'risk-notes', title: 'Risk Notes', description: 'Severity and context for identified risks.', included: true },
  { id: 'recommendations', title: 'Recommendations', description: 'Prioritized actions for gap remediation.', included: true },
  { id: 'appendix', title: 'Evidence Appendix', description: 'Detailed evidence index and file references.', included: true },
]

export function ReportBuilderPage() {
  const [included, setIncluded] = useState<Set<string>>(() => new Set(sections.map((section) => section.id)))
  const toggle = (id: string) => setIncluded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><h2 className="font-semibold text-slate-100">Report sections</h2><p className="mt-1 text-xs text-slate-500">Select content for the security evidence report.</p></div><Badge tone="slate">PDF</Badge></div>
        <div className="divide-y divide-slate-800 p-2">{sections.map((section) => {
          const selected = included.has(section.id)
          return <div key={section.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-800/25"><GripVertical className="shrink-0 text-slate-700" size={17} /><button type="button" onClick={() => toggle(section.id)} aria-pressed={selected} className={`grid size-5 shrink-0 place-items-center rounded border ${selected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-600 bg-slate-900'}`}>{selected ? <Check size={13} /> : null}</button><div><p className="text-sm font-medium text-slate-200">{section.title}</p><p className="mt-1 text-xs text-slate-500">{section.description}</p></div></div>
        })}</div>
      </Card>
      <Card className="h-fit p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-100">Report readiness</h2><span className="text-2xl font-semibold text-cyan-300">64%</span></div>
        <div className="mt-4"><ProgressBar value={64} /></div>
        <div className="mt-5 space-y-3 text-sm"><Row label="Controls covered" value="14 / 22" /><Row label="Evidence collected" value="24" /><Row label="Open gaps" value="6" warning /><Row label="High-risk gaps" value="2" warning /></div>
        <Button icon={FileText} className="mt-5 w-full" disabled title="Report generation is coming soon">Generate report · Coming soon</Button>
        <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 shrink-0" size={14} />Reports require professional review before use.</p>
      </Card>
    </div>
  )
}

function Row({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">{label}</span><span className={warning ? 'text-amber-300' : 'text-emerald-300'}>{value}</span></div>
}
