import type { Project } from '../../../shared/types'

export const ACME_PROJECT_ID = 'acme-security-review-2026'

export const mockProjects: Project[] = [
  {
    id: ACME_PROJECT_ID,
    clientName: 'ACME S.L.',
    projectName: '2026 Security Evidence Review',
    packType: 'Basic Security Evidence Pack',
    description: 'Internal cybersecurity evidence review for client/security questionnaire preparation.',
    deadline: '2026-09-30',
    createdAt: '2026-05-04T09:00:00Z',
    updatedAt: '2026-07-11T16:30:00Z',
    readinessPercent: 64,
    evidenceCount: 24,
    controlsCovered: 14,
    controlsTotal: 22,
    openGaps: 6,
    highRiskGaps: 2,
  },
]

export const activeProject = mockProjects[0]
