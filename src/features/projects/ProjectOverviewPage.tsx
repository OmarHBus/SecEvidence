import { AlertTriangle, ClipboardCheck, FileClock, Files, Gauge, ShieldAlert } from 'lucide-react'
import { Badge, Card, ProgressBar, StatCard } from '../../shared/components'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'
import { mockEvidence } from '../evidence/data/mock-evidence'
import { mockRisks } from '../risks/data/mock-risks'
import { activeProject } from './data/mock-projects'

const coverage = [
  ['access_control', 58], ['backups', 50], ['asset_inventory', 82], ['endpoint_security', 91],
  ['network_security', 76], ['incident_response', 44], ['supplier_management', 38], ['policies', 86],
] as const

export function ProjectOverviewPage() {
  const recent = mockEvidence.filter((item) => item.status !== 'missing').slice(0, 5)
  const missing = mockEvidence.filter((item) => item.status === 'missing' || item.status === 'outdated')
  const priorityRisks = mockRisks.filter((risk) => risk.severity === 'high').slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Readiness" value="64%" detail="Current evidence pack" icon={Gauge} tone="cyan" />
        <StatCard label="Evidence" value="24" detail={`${mockEvidence.length} shown in library`} icon={Files} tone="green" />
        <StatCard label="Controls" value="14 / 22" detail="Controls covered" icon={ClipboardCheck} tone="cyan" />
        <StatCard label="Open gaps" value="6" detail="Remediation required" icon={AlertTriangle} tone="amber" />
        <StatCard label="High risk" value="2" detail="Prioritize before export" icon={ShieldAlert} tone="red" />
        <StatCard label="Pending review" value="3" detail="Evidence needs review" icon={FileClock} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <SectionTitle title="Coverage by category" detail={`${activeProject.clientName} · ${activeProject.packType}`} />
          <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            {coverage.map(([category, value]) => <div key={category}><div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">{categoryLabels[category]}</span><span className="text-slate-400">{value}%</span></div><ProgressBar value={value} tone={value < 55 ? 'amber' : 'cyan'} /></div>)}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Missing evidence" detail="Missing or outdated items" />
          <div className="divide-y divide-slate-800">
            {missing.map((item) => <div key={item.id} className="px-5 py-4"><div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-200">{item.title}</p><Badge tone="red">{statusLabels[item.status]}</Badge></div><p className="mt-1 text-xs text-slate-500">{item.notes}</p></div>)}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <SectionTitle title="Recent evidence" detail="Recently added workspace items" />
          <div className="divide-y divide-slate-800">
            {recent.map((item) => <div key={item.id} className="flex items-center gap-3 px-5 py-3.5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{item.title}</p><p className="mt-1 text-xs text-slate-500">{categoryLabels[item.category]} · {formatDate(item.evidenceDate)}</p></div><Badge tone={item.status === 'accepted' ? 'green' : 'amber'}>{statusLabels[item.status]}</Badge></div>)}
          </div>
        </Card>
        <Card>
          <SectionTitle title="High priority gaps" detail="Highest-risk open work" />
          <div className="space-y-3 p-4">{priorityRisks.map((risk) => <div key={risk.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="flex justify-between"><Badge tone="red">{risk.severity}</Badge><Badge tone="slate">{risk.status.replace('_', ' ')}</Badge></div><p className="mt-2 text-sm text-slate-200">{risk.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{risk.recommendation}</p></div>)}</div>
        </Card>
      </div>
    </div>
  )
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-slate-100">{title}</h2><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
}
