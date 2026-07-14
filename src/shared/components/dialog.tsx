import { useEffect, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'

export const inputClass =
  'se-input min-h-10 resize-none py-2.5 [&:not(textarea)]:py-0'

export const dialogInsetPanelClass =
  'rounded-lg border border-white/[0.06] bg-zinc-950/40'

export const dialogCheckboxGridClass =
  'grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-zinc-950/40 p-3 sm:grid-cols-2'

export const dialogCheckboxLabelClass =
  'flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-zinc-300 transition hover:bg-white/[0.03]'

export const dialogEmptyHintClass =
  'rounded-lg border border-dashed border-zinc-700/50 p-4 text-sm text-zinc-500'

export const dialogLegendClass = 'mb-2 text-xs font-medium text-zinc-400'

const maxWidthClass = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
} as const

type DialogMaxWidth = keyof typeof maxWidthClass

interface DialogProps {
  titleId: string
  title: string
  description?: string
  onClose: () => void
  maxWidth?: DialogMaxWidth
  children: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  footer?: ReactNode
  scrollable?: boolean
}

export function Dialog({
  titleId,
  title,
  description,
  onClose,
  maxWidth = 'md',
  children,
  onSubmit,
  footer,
  scrollable = true,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const body = scrollable ? (
    <div className="max-h-[calc(92vh-132px)] overflow-y-auto">{children}</div>
  ) : (
    children
  )

  const content = (
    <>
      <DialogHeader titleId={titleId} title={title} description={description} onClose={onClose} />
      {onSubmit ? (
        <form onSubmit={onSubmit} noValidate>
          {body}
          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </form>
      ) : (
        <>
          {body}
          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </>
      )}
    </>
  )

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[92vh] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#141820] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)_inset] ${maxWidthClass[maxWidth]}`}
      >
        {content}
      </section>
    </div>
  )
}

export function DialogHeader({
  titleId,
  title,
  description,
  onClose,
}: {
  titleId: string
  title: string
  description?: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
      <div className="min-w-0">
        <h2 id={titleId} className="font-semibold text-zinc-100">
          {title}
        </h2>
        {description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}
      </div>
      <button
        type="button"
        title="Close dialog"
        aria-label="Close dialog"
        onClick={onClose}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-zinc-500 transition hover:border-zinc-600/60 hover:bg-zinc-800/80 hover:text-zinc-100"
      >
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

export function DialogBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-5 p-5 sm:grid-cols-2 ${className}`}>{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-3 border-t border-white/[0.06] bg-zinc-950/20 px-5 py-4">
      {children}
    </div>
  )
}

export function FormField({
  id,
  label,
  required = false,
  error,
  className = '',
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
        {required ? <span className="text-rose-400" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
    </div>
  )
}

export function DialogDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">{label}</p>
      <p className={`mt-1 text-sm text-zinc-300 ${mono ? 'break-all font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
