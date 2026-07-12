import { Settings, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigation } from './navigation'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-800 bg-[#09111f] lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5"><div className="grid size-9 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"><Shield size={19} /></div><div><div className="font-semibold tracking-tight text-white">SecEvidence</div><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Desktop</div></div></div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Primary navigation">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}><Icon size={17} />{label}</NavLink>)}</nav>
      <div className="border-t border-slate-800 p-3"><NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}><Settings size={17} />Settings</NavLink><p className="mt-4 px-3 text-[11px] text-slate-600">Local workspace · v0.1</p></div>
    </aside>
  )
}
