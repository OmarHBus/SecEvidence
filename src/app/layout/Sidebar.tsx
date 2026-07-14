import { Settings, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigation } from './navigation'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-teal-500/10 text-teal-300 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.12)]'
      : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200'
  }`

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.06] bg-[#0d1016] lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="grid size-9 place-items-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-300">
          <Shield size={18} strokeWidth={2} />
        </div>
        <div>
          <div className="font-semibold tracking-tight text-zinc-50">SecEvidence</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Desktop</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Primary navigation">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass}>
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <NavLink to="/settings" className={navClass}>
          <Settings size={17} strokeWidth={2} />
          Settings
        </NavLink>
        <p className="mt-4 px-3 text-[11px] text-zinc-600">Local workspace · v0.1</p>
      </div>
    </aside>
  )
}
