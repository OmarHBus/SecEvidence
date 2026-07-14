import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

const tones = {
  cyan: 'border-teal-500/20 bg-teal-500/10 text-teal-300',
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  red: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  slate: 'border-zinc-600/40 bg-zinc-800/60 text-zinc-300',
} as const

export type Tone = keyof typeof tones

export {
  Dialog,
  DialogBody,
  DialogDetail,
  DialogFooter,
  dialogCheckboxGridClass,
  dialogCheckboxLabelClass,
  dialogEmptyHintClass,
  dialogInsetPanelClass,
  dialogLegendClass,
  FormField,
  inputClass,
} from './dialog'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: LucideIcon
}

export function Button({ variant = 'primary', icon: Icon, className = '', children, ...props }: ButtonProps) {
  const variants = {
    primary:
      'bg-teal-500 text-zinc-950 shadow-sm shadow-teal-950/30 hover:bg-teal-400 focus-visible:ring-2 focus-visible:ring-teal-400/40',
    secondary:
      'border border-zinc-700/80 bg-zinc-800/50 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-teal-400/20',
    ghost: 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
  }
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

type IconButtonVariant = 'default' | 'accent' | 'edit' | 'danger'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  variant?: IconButtonVariant
}

const iconButtonVariants: Record<IconButtonVariant, string> = {
  default: 'text-zinc-500 hover:border-zinc-600/60 hover:bg-zinc-800/80 hover:text-zinc-200',
  accent: 'text-teal-400/80 hover:border-teal-500/25 hover:bg-teal-500/10 hover:text-teal-300',
  edit: 'text-zinc-500 hover:border-zinc-600/60 hover:bg-zinc-800/80 hover:text-zinc-100',
  danger: 'text-rose-400/75 hover:border-rose-500/25 hover:bg-rose-500/10 hover:text-rose-300',
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'default',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition ${iconButtonVariants[variant]} ${className}`}
      {...props}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

export function ActionGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-end gap-1 ${className}`}>{children}</div>
}

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.07] bg-[#141820] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.45)] ${className}`}
    >
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function StatusDot({ tone = 'slate' }: { tone?: Tone }) {
  const colors = {
    cyan: 'bg-teal-400',
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-rose-400',
    slate: 'bg-zinc-500',
  }
  return <span className={`inline-block size-2 rounded-full ${colors[tone]}`} aria-hidden="true" />
}

export function ProgressBar({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'green' | 'amber' }) {
  const colors = { cyan: 'bg-teal-400', green: 'bg-emerald-400', amber: 'bg-amber-400' }
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${colors[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'cyan',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: Tone
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-zinc-50">{value}</p>
        </div>
        <div className={`shrink-0 rounded-lg border p-2.5 ${tones[tone]}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-zinc-500">{detail}</p>
    </Card>
  )
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/20 px-6 py-12 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-xl border border-zinc-700/40 bg-zinc-800/40 text-zinc-500">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h3 className="font-medium text-zinc-200">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  width?: string
  align?: 'left' | 'center' | 'right'
  hideHeader?: boolean
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function DataTable<T>({ columns, rows, getKey }: { columns: Column<T>[]; rows: T[]; getKey: (item: T) => string }) {
  return (
    <div className="w-full">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-white/[0.06] bg-zinc-950/30 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2.5 font-medium ${alignClass[column.align ?? 'left']} ${column.className ?? ''}`}
              >
                {column.hideHeader ? <span className="sr-only">{column.header}</span> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rows.map((row) => (
            <tr key={getKey(row)} className="transition-colors hover:bg-white/[0.02]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-3 align-middle ${alignClass[column.align ?? 'left']} ${column.className ?? ''}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
        selected
          ? 'border-teal-500/25 bg-teal-500/10 text-teal-300'
          : 'border-white/[0.07] bg-zinc-900/40 text-zinc-500 hover:border-zinc-600/60 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label = 'Search',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
}) {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.07] bg-zinc-900/50 px-3 text-sm text-zinc-500 transition focus-within:border-teal-500/30 focus-within:ring-2 focus-within:ring-teal-500/10">
      <span className="sr-only">{label}</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-600" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-600"
      />
    </label>
  )
}
