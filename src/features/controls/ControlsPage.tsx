import { CheckCircle2, Circle, CircleDot, Plus, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, ProgressBar } from '../../shared/components'
import type { ControlStatus, RiskSeverity } from '../../shared/types'
import { categoryLabels } from '../../shared/utils/formatters'
import { mockControls } from './data/mock-controls'

const statusConfig: Record<ControlStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'slate'; icon: typeof Circle }> = {
  covered: { label: 'Covered', tone: 'green', icon: CheckCircle2 },
  gap: { label: 'Gap', tone: 'red', icon: TriangleAlert },
  in_progress: { label: 'In progress', tone: 'amber', icon: CircleDot },
  not_applicable: { label: 'Not applicable', tone: 'slate', icon: Circle },
}
const riskTone: Record<RiskSeverity, 'green' | 'amber' | 'red'> = { low: 'green', medium: 'amber', high: 'red', critical: 'red' }

export function ControlsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="w-full max-w-md"><div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">14 of 22 controls covered</span><span className="font-medium text-cyan-300">64%</span></div><ProgressBar value={64} /></div>
        <Button icon={Plus} disabled title="Custom controls are coming soon">Add control · Coming soon</Button>
      </div>
      <div className="flex flex-wrap gap-2">{['All controls 22', 'Covered 14', 'In progress 3', 'Gaps 6'].map((label, index) => <button key={label} type="button" className={`rounded-lg border px-3 py-2 text-xs ${index === 0 ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>{label}</button>)}</div>
      <Card className="divide-y divide-slate-800">
        {mockControls.map((control) => {
          const config = statusConfig[control.status]
          const Icon = config.icon
          return <div key={control.id} className="grid gap-3 p-4 hover:bg-slate-800/20 md:grid-cols-[42px_minmax(0,1fr)_140px_120px_140px] md:items-center">
            <div className="grid size-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><Icon size={18} /></div>
            <div><h3 className="text-sm font-medium text-slate-200">{control.name}</h3><p className="mt-1.5 text-xs text-slate-500">{control.description}</p></div>
            <span className="text-xs text-slate-500">{categoryLabels[control.category]}</span>
            <Badge tone={riskTone[control.riskLevel]}>{control.riskLevel} risk</Badge>
            <div className="flex items-center justify-between gap-2 md:justify-end"><span className="text-xs text-slate-500">{control.linkedEvidenceIds.length} evidence</span><Badge tone={config.tone}>{config.label}</Badge></div>
          </div>
        })}
      </Card>
    </div>
  )
}
