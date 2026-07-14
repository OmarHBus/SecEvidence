import { AlertTriangle, CircleDot, ClipboardCheck, FileClock, Files, Gauge, ShieldAlert } from 'lucide-react'
import { useAppData } from '../../app/state/useAppData'
import { Badge, Card, EmptyState, ProgressBar, StatCard } from '../../shared/components'
import type { EvidenceCategory } from '../../shared/types'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'

const evidenceTone = {
  accepted: 'green',
  needs_review: 'amber',
  missing: 'red',
  outdated: 'red',
} as const

const riskTone = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'slate',
} as const

export function ProjectOverviewPage() {
  const { activeProject, evidenceItems, controls, risks, stats } = useAppData()

  if (!activeProject) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={Gauge}
          title="No active project"
          description="Select or create a project to view readiness, evidence, control coverage, and gaps."
        />
      </Card>
    )
  }

  const recentEvidence = [...evidenceItems]
    .sort((left, right) => (
      new Date(right.updatedAt || right.createdAt).getTime()
      - new Date(left.updatedAt || left.createdAt).getTime()
    ))
    .slice(0, 5)
  const missingControls = controls.filter((control) => (
    control.status === 'gap'
    || (control.status === 'covered' && control.linkedEvidenceIds.length === 0)
  ))
  const priorityGaps = risks
    .filter((risk) => (
      (risk.severity === 'high' || risk.severity === 'critical')
      && (risk.status === 'open' || risk.status === 'in_progress')
    ))
    .sort((left, right) => {
      if (left.severity === right.severity) {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }
      return left.severity === 'critical' ? -1 : 1
    })

  const coverageByCategory = Object.entries(
    controls
      .filter((control) => control.status !== 'not_applicable')
      .reduce<Partial<Record<EvidenceCategory, { applicable: number; covered: number }>>>((result, control) => {
        const current = result[control.category] ?? { applicable: 0, covered: 0 }
        result[control.category] = {
          applicable: current.applicable + 1,
          covered: current.covered + (control.status === 'covered' ? 1 : 0),
        }
        return result
      }, {}),
  ) as [EvidenceCategory, { applicable: number; covered: number }][]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Readiness" value={`${stats.readinessPercent}%`} detail="Covered / applicable controls" icon={Gauge} tone="cyan" />
        <StatCard label="Total evidence" value={String(stats.totalEvidence)} detail="Items in this project" icon={Files} tone="green" />
        <StatCard label="Controls" value={String(stats.controlsTotal)} detail={`${stats.controlsCovered} covered`} icon={ClipboardCheck} tone="cyan" />
        <StatCard label="In progress" value={String(stats.controlsInProgress)} detail="Controls being implemented" icon={CircleDot} tone="amber" />
        <StatCard label="Control gaps" value={String(stats.controlsWithGaps)} detail="Controls marked as gaps" icon={AlertTriangle} tone="amber" />
        <StatCard label="Open gaps" value={String(stats.openGaps)} detail="Open or in-progress risks" icon={AlertTriangle} tone="amber" />
        <StatCard label="High / critical" value={String(stats.highCriticalGaps)} detail="Priority open gaps" icon={ShieldAlert} tone="red" />
        <StatCard label="Pending review" value={String(stats.pendingReviewEvidence)} detail="Evidence needs review" icon={FileClock} tone="amber" />
        <StatCard label="Outdated" value={String(stats.outdatedEvidence)} detail="Evidence needs renewal" icon={FileClock} tone="red" />
        <StatCard label="Applicable controls" value={String(stats.applicableControls)} detail={`${stats.controlsCovered} currently covered`} icon={ClipboardCheck} tone="slate" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <SectionTitle title="Coverage by category" detail={`${activeProject.clientName} · ${activeProject.packType}`} />
          {coverageByCategory.length === 0 ? (
            <div className="p-5"><EmptyState icon={ClipboardCheck} title="No applicable controls" description="Add applicable controls to calculate category coverage." /></div>
          ) : (
            <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              {coverageByCategory.map(([category, counts]) => {
                const value = Math.round((counts.covered / counts.applicable) * 100)
                return (
                  <div key={category}>
                    <div className="mb-2 flex justify-between gap-3 text-xs">
                      <span className="text-zinc-300">{categoryLabels[category]}</span>
                      <span className="text-zinc-400">{counts.covered}/{counts.applicable} · {value}%</span>
                    </div>
                    <ProgressBar value={value} tone={value < 55 ? 'amber' : 'cyan'} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle title="Missing evidence / gap controls" detail="Control coverage requiring attention" />
          {controls.length === 0 ? (
            <div className="p-5"><EmptyState icon={ClipboardCheck} title="No controls yet" description="Add controls to identify evidence and coverage gaps." /></div>
          ) : missingControls.length === 0 ? (
            <div className="p-5"><EmptyState icon={ClipboardCheck} title="No control gaps" description="All covered controls have linked evidence and no controls are marked as gaps." /></div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {missingControls.map((control) => {
                const hasNoEvidence = control.status === 'covered' && control.linkedEvidenceIds.length === 0
                return (
                  <div key={control.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-200">{control.name}</p>
                      <Badge tone={hasNoEvidence ? 'amber' : 'red'}>{hasNoEvidence ? 'No linked evidence' : 'Gap'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{categoryLabels[control.category]}{control.owner ? ` · ${control.owner}` : ''}</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <SectionTitle title="Recent evidence" detail="Recently added workspace items" />
          {recentEvidence.length === 0 ? (
            <div className="p-5"><EmptyState icon={Files} title="No evidence yet" description="Add evidence to populate the recent activity list." /></div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentEvidence.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{item.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{categoryLabels[item.category]} · Updated {formatDate(item.updatedAt || item.createdAt)}</p>
                  </div>
                  <Badge tone={evidenceTone[item.status]}>{statusLabels[item.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle title="High priority gaps" detail="Highest-risk open work" />
          {risks.length === 0 ? (
            <div className="p-5"><EmptyState icon={ShieldAlert} title="No risks or gaps yet" description="Add risks or gaps to track remediation priorities." /></div>
          ) : priorityGaps.length === 0 ? (
            <div className="p-5"><EmptyState icon={ShieldAlert} title="No high-priority open gaps" description="There are no open or in-progress high or critical risks." /></div>
          ) : (
            <div className="space-y-3 p-4">
              {priorityGaps.map((risk) => (
                <div key={risk.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <div className="flex justify-between gap-3">
                    <Badge tone={riskTone[risk.severity]}>{risk.severity}</Badge>
                    <Badge tone={risk.status === 'open' ? 'red' : 'amber'}>{risk.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{risk.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{risk.recommendation ?? risk.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div className="border-b border-zinc-800 px-5 py-4"><h2 className="font-semibold text-zinc-100">{title}</h2><p className="mt-1 text-xs text-zinc-500">{detail}</p></div>
}
