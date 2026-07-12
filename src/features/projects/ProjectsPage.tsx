import { ArrowRight, CalendarDays, FolderPlus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, ProgressBar } from '../../shared/components'
import { formatDate } from '../../shared/utils/formatters'
import { mockProjects } from './data/mock-projects'

export function ProjectsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-400">Choose a local evidence workspace to continue.</p>
        <Button icon={Plus} disabled title="Project creation is coming soon">New project · Coming soon</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {mockProjects.map((project) => (
          <Card key={project.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-lg bg-slate-800 text-cyan-300"><FolderPlus size={19} /></div>
              <Badge tone="cyan">{project.packType}</Badge>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-50">{project.clientName} — {project.projectName}</h2>
            <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{project.description}</p>
            <div className="mt-5 flex items-center justify-between text-xs"><span className="text-slate-500">Readiness</span><span className="font-semibold text-slate-200">{project.readinessPercent}%</span></div>
            <div className="mt-2"><ProgressBar value={project.readinessPercent} /></div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-800 py-4 text-center">
              <Metric value={String(project.evidenceCount)} label="Evidence" />
              <Metric value={`${project.controlsCovered}/${project.controlsTotal}`} label="Controls" />
              <Metric value={String(project.openGaps)} label="Gaps" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />Updated {formatDate(project.updatedAt)}</span>
              <Button variant="ghost" icon={ArrowRight} onClick={() => navigate('/overview')}>Open</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div><p className="font-semibold text-slate-200">{value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>
}
