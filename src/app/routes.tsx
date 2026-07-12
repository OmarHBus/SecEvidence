import { Navigate, Route, Routes } from 'react-router-dom'
import { ControlsPage } from '../features/controls/ControlsPage'
import { EvidenceLibraryPage } from '../features/evidence/EvidenceLibraryPage'
import { ExportPage } from '../features/exports/ExportPage'
import { ProjectOverviewPage } from '../features/projects/ProjectOverviewPage'
import { ProjectsPage } from '../features/projects/ProjectsPage'
import { ReportBuilderPage } from '../features/reports/ReportBuilderPage'
import { RisksPage } from '../features/risks/RisksPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { AppLayout } from './layout/AppLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/overview" element={<ProjectOverviewPage />} />
        <Route path="/evidence" element={<EvidenceLibraryPage />} />
        <Route path="/controls" element={<ControlsPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/reports" element={<ReportBuilderPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  )
}
