import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/projects': { title: 'Projects', subtitle: 'Manage local evidence workspaces' },
  '/overview': { title: 'Security evidence overview', subtitle: 'ACME S.L. — 2026 Security Evidence Review' },
  '/evidence': { title: 'Evidence library', subtitle: 'Collect, review, and map evidence' },
  '/controls': { title: 'Control checklist', subtitle: 'Track security control coverage' },
  '/risks': { title: 'Gap register', subtitle: 'Prioritize evidence and control gaps' },
  '/reports': { title: 'Report builder', subtitle: 'Assemble a review-ready report' },
  '/export': { title: 'Export center', subtitle: 'Package local project artifacts' },
  '/settings': { title: 'Settings', subtitle: 'Configure this local workspace' },
}

export function Topbar() {
  const location = useLocation()
  const current = pageTitles[location.pathname] ?? pageTitles['/overview']
  return <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur md:px-6"><div className="flex min-w-0 items-center gap-3"><button type="button" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Navigation menu"><Menu size={20} /></button><div className="min-w-0"><h1 className="truncate text-sm font-semibold text-slate-100 md:text-base">{current.title}</h1><p className="hidden truncate text-xs text-slate-500 sm:block">{current.subtitle}</p></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-500 md:flex"><Search size={14} />Search workspace <kbd className="ml-4 text-slate-600">⌘K</kbd></div><div className="grid size-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">AC</div></div></header>
}
