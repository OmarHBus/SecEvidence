import { AlertOctagon, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge, Card, DataTable, StatCard, type Column } from '../../shared/components'
import type { RiskItem } from '../../shared/types'
import { controlNameById } from '../controls/data/mock-controls'
import { mockRisks } from './data/mock-risks'

const severityTone = { critical: 'red', high: 'red', medium: 'amber', low: 'slate' } as const
const statusTone = { open: 'red', in_progress: 'amber', accepted: 'slate', closed: 'green' } as const

const columns: Column<RiskItem>[] = [
  { key: 'gap', header: 'Gap', render: (risk) => <div className="max-w-md"><p className="font-medium text-slate-200">{risk.title}</p><p className="mt-1 text-xs text-slate-500">{risk.description}</p></div> },
  { key: 'severity', header: 'Severity', render: (risk) => <Badge tone={severityTone[risk.severity]}>{risk.severity}</Badge> },
  { key: 'control', header: 'Related control', render: (risk) => <span className="text-slate-300">{risk.relatedControlId ? controlNameById.get(risk.relatedControlId) : '—'}</span> },
  { key: 'recommendation', header: 'Recommendation', render: (risk) => <span className="block max-w-md text-xs leading-5 text-slate-500">{risk.recommendation ?? '—'}</span> },
  { key: 'status', header: 'Status', render: (risk) => <Badge tone={statusTone[risk.status]}>{risk.status.replace('_', ' ')}</Badge> },
]

export function RisksPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Critical" value="0" detail="No critical gaps" icon={AlertOctagon} tone="green" />
        <StatCard label="High" value="2" detail="Immediate attention" icon={ShieldAlert} tone="red" />
        <StatCard label="Medium" value="3" detail="Open remediation" icon={AlertTriangle} tone="amber" />
        <StatCard label="Accepted" value="0" detail="No accepted gaps" icon={ShieldCheck} tone="slate" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold text-slate-200">Open gaps</h2><p className="mt-1 text-xs text-slate-500">Five documented security evidence gaps</p></div>
        <DataTable columns={columns} rows={mockRisks} getKey={(risk) => risk.id} />
      </Card>
    </div>
  )
}
