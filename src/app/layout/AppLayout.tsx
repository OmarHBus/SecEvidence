import { Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { navigation } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppData } from '../state/useAppData'

export function AppLayout() {
  const { settings } = useAppData()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-[#09111f] px-3 py-2 lg:hidden" aria-label="Mobile navigation">
          {[...navigation, { to: '/settings', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs ${isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-500'}`}><Icon size={14} />{label}</NavLink>)}
        </nav>
        <main className="mx-auto max-w-[1500px] p-4 md:p-6"><Outlet /></main>
        {settings.localFirstReminderEnabled ? (
          <div className="border-t border-cyan-400/10 bg-cyan-400/5 px-6 py-3 text-center text-xs text-cyan-200/80">
            Your evidence files stay on this device unless you explicitly export or move them.
          </div>
        ) : null}
        <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs leading-5 text-slate-600">
          SecEvidence helps organize evidence and prepare reports. It does not guarantee compliance and does not replace professional auditing or legal advice.
        </footer>
      </div>
    </div>
  )
}
