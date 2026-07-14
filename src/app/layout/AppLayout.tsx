import { Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { navigation } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppData } from '../state/useAppData'

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition ${
    isActive ? 'bg-teal-500/10 text-teal-300' : 'text-zinc-500 hover:text-zinc-300'
  }`

export function AppLayout() {
  const { settings } = useAppData()

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <nav
          className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0d1016] px-3 py-2 lg:hidden"
          aria-label="Mobile navigation"
        >
          {[...navigation, { to: '/settings', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={mobileNavClass}>
              <Icon size={14} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-[1500px] p-4 md:p-6">
          <Outlet />
        </main>
        {settings.localFirstReminderEnabled ? (
          <div className="border-t border-teal-500/10 bg-teal-500/[0.04] px-6 py-3 text-center text-xs text-teal-200/75">
            Your evidence files stay on this device unless you explicitly export or move them.
          </div>
        ) : null}
        <footer className="border-t border-white/[0.06] px-6 py-4 text-center text-xs leading-5 text-zinc-600">
          SecEvidence helps organize evidence and prepare reports. It does not guarantee compliance and does not replace professional auditing or legal advice.
        </footer>
      </div>
    </div>
  )
}
