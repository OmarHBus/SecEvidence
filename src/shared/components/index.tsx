import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

const tones = {
  cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  red: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  slate: 'border-slate-600 bg-slate-800 text-slate-300',
} as const

export type Tone = keyof typeof tones

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: LucideIcon
}

export function Button({ variant = 'primary', icon: Icon, className = '', children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400',
    secondary: 'border border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-500 hover:bg-slate-700',
    ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
  }
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm ${className}`}>{children}</div>
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${tones[tone]}`}>{children}</span>
}

export function StatusDot({ tone = 'slate' }: { tone?: Tone }) {
  const colors = { cyan: 'bg-cyan-400', green: 'bg-emerald-400', amber: 'bg-amber-400', red: 'bg-rose-400', slate: 'bg-slate-500' }
  return <span className={`inline-block size-2 rounded-full ${colors[tone]}`} aria-hidden="true" />
}

export function ProgressBar({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'green' | 'amber' }) {
  const colors = { cyan: 'bg-cyan-400', green: 'bg-emerald-400', amber: 'bg-amber-400' }
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'cyan' }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">{value}</p>
        </div>
        <div className={`rounded-lg border p-2 ${tones[tone]}`}><Icon size={17} /></div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Card>
  )
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center">
      <Icon className="mb-3 text-slate-500" size={24} />
      <h3 className="font-medium text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

export function DataTable<T>({ columns, rows, getKey }: { columns: Column<T>[]; rows: T[]; getKey: (item: T) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-500">
          <tr>{columns.map((column) => <th key={column.key} className={`px-4 py-3 font-medium ${column.className ?? ''}`}>{column.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {rows.map((row) => (
            <tr key={getKey(row)} className="transition hover:bg-slate-800/30">
              {columns.map((column) => <td key={column.key} className={`px-4 py-3.5 ${column.className ?? ''}`}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
