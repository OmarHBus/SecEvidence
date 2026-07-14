import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAppData } from '../state/useAppData'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/projects': { title: 'Projects', subtitle: 'Manage local evidence workspaces' },
  '/overview': { title: 'Security evidence overview', subtitle: 'Active project overview' },
  '/evidence': { title: 'Evidence library', subtitle: 'Collect, review, and map evidence' },
  '/controls': { title: 'Control checklist', subtitle: 'Track security control coverage' },
  '/risks': { title: 'Gap register', subtitle: 'Prioritize evidence and control gaps' },
  '/reports': { title: 'Report builder', subtitle: 'Assemble a review-ready report' },
  '/export': { title: 'Export center', subtitle: 'Package local project artifacts' },
  '/settings': { title: 'Settings', subtitle: 'Configure this local workspace' },
}

export function Topbar() {
  const location = useLocation()
  const { activeProject, settings } = useAppData()
  const current = pageTitles[location.pathname] ?? pageTitles['/overview']
  const projectSubtitle = location.pathname === '/projects' || location.pathname === '/settings'
    ? current.subtitle
    : activeProject
      ? `${activeProject.clientName} — ${activeProject.projectName}`
      : 'No active project'
  const initials = settings.consultantCompanyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SE'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0f1218]/95 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200 lg:hidden"
          aria-label="Navigation menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-zinc-100 md:text-base">{current.title}</h1>
          <p className="hidden truncate text-xs text-zinc-500 sm:block">{projectSubtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500 md:flex">
          <Search size={14} strokeWidth={2} />
          Local workspace
        </div>
        <div
          className="grid size-8 place-items-center rounded-full border border-white/[0.08] bg-zinc-800/80 text-xs font-semibold text-zinc-200"
          title={settings.consultantCompanyName}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
