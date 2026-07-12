import type { Control, EvidenceItem, RiskItem } from '../../shared/types'
import type { AppDataStats } from './app-data-context'

export const EMPTY_APP_DATA_STATS: AppDataStats = {
  totalEvidence: 0,
  controlsTotal: 0,
  controlsCovered: 0,
  controlsInProgress: 0,
  controlsWithGaps: 0,
  applicableControls: 0,
  openGaps: 0,
  highCriticalGaps: 0,
  pendingReviewEvidence: 0,
  outdatedEvidence: 0,
  readinessPercent: 0,
}

export function calculateStats(
  evidenceItems: readonly EvidenceItem[],
  controls: readonly Control[],
  risks: readonly RiskItem[],
): AppDataStats {
  const applicableControls = controls.filter((control) => control.status !== 'not_applicable').length
  const controlsCovered = controls.filter((control) => control.status === 'covered').length
  const openRisks = risks.filter(
    (risk) => risk.status === 'open' || risk.status === 'in_progress',
  )

  return {
    totalEvidence: evidenceItems.length,
    controlsTotal: controls.length,
    controlsCovered,
    controlsInProgress: controls.filter((control) => control.status === 'in_progress').length,
    controlsWithGaps: controls.filter((control) => control.status === 'gap').length,
    applicableControls,
    openGaps: openRisks.length,
    highCriticalGaps: openRisks.filter(
      (risk) => risk.severity === 'high' || risk.severity === 'critical',
    ).length,
    pendingReviewEvidence: evidenceItems.filter((item) => item.status === 'needs_review').length,
    outdatedEvidence: evidenceItems.filter((item) => item.status === 'outdated').length,
    readinessPercent:
      applicableControls === 0 ? 0 : Math.round((controlsCovered / applicableControls) * 100),
  }
}
