import { BarChart3, ClipboardCheck, FileArchive, FileText, FolderKanban, LayoutDashboard, TriangleAlert } from 'lucide-react'

export const navigation = [
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/evidence', label: 'Evidence', icon: FileArchive },
  { to: '/controls', label: 'Controls', icon: ClipboardCheck },
  { to: '/risks', label: 'Risks', icon: TriangleAlert },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/export', label: 'Export', icon: BarChart3 },
] as const
