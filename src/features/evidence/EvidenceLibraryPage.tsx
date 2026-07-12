import { FileUp, Search } from 'lucide-react'
import { Badge, Button, Card, DataTable, type Column } from '../../shared/components'
import type { EvidenceItem } from '../../shared/types'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'
import { controlNameById } from '../controls/data/mock-controls'
import { mockEvidence } from './data/mock-evidence'

const toneByStatus = { accepted: 'green', needs_review: 'amber', missing: 'red', outdated: 'red' } as const

const columns: Column<EvidenceItem>[] = [
  { key: 'title', header: 'Title', render: (item) => <span className="font-medium text-slate-200">{item.title}</span> },
  { key: 'category', header: 'Category', render: (item) => <span className="whitespace-nowrap text-slate-400">{categoryLabels[item.category]}</span> },
  { key: 'control', header: 'Linked control', render: (item) => <span className="block min-w-36 text-slate-300">{item.linkedControlIds.map((id) => controlNameById.get(id) ?? id).join(', ') || '—'}</span> },
  { key: 'status', header: 'Status', render: (item) => <Badge tone={toneByStatus[item.status]}>{statusLabels[item.status]}</Badge> },
  { key: 'owner', header: 'Owner', render: (item) => <span className="whitespace-nowrap text-slate-400">{item.owner ?? '—'}</span> },
  { key: 'date', header: 'Date', render: (item) => <span className="whitespace-nowrap text-slate-500">{formatDate(item.evidenceDate)}</span> },
  { key: 'file', header: 'File name', render: (item) => <span className="block max-w-48 truncate text-slate-400" title={item.fileName}>{item.fileName ?? '—'}</span> },
  { key: 'notes', header: 'Notes', render: (item) => <span className="block min-w-56 max-w-72 text-xs leading-5 text-slate-500">{item.notes ?? '—'}</span> },
]

const statusFilters = ['All', 'Accepted', 'Needs review', 'Missing', 'Outdated']
const categoryFilters = ['Access Control', 'Backups', 'Assets', 'Endpoint Security', 'Network', 'Policies', 'Suppliers', 'Incident Response']

export function EvidenceLibraryPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-500 xl:max-w-sm"><Search size={15} /><span>Search evidence…</span></div>
        <Button icon={FileUp} disabled title="Evidence upload is coming soon">Add evidence · Coming soon</Button>
      </div>
      <FilterRow label="Status" values={statusFilters} />
      <FilterRow label="Category" values={categoryFilters} />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs text-slate-500"><span>{mockEvidence.length} items shown · 24 total evidence items</span><span>Local workspace</span></div>
        <DataTable columns={columns} rows={mockEvidence} getKey={(item) => item.id} />
      </Card>
    </div>
  )
}

function FilterRow({ label, values }: { label: string; values: string[] }) {
  return <div className="flex items-center gap-2 overflow-x-auto"><span className="mr-1 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-600">{label}</span>{values.map((value, index) => <button key={value} type="button" className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${index === 0 ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>{value}</button>)}</div>
}
