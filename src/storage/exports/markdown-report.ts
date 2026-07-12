import type { AppSettings, Control, EvidenceItem, Project, RiskItem } from '../../shared/types'
import type { AppDataStats } from '../../app/state/app-data-context'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'

const DISCLAIMER =
  'SecEvidence helps organize evidence and prepare reports. It does not guarantee compliance and does not replace professional auditing or legal advice.'

export interface MarkdownReportInput {
  project: Project
  evidenceItems: readonly EvidenceItem[]
  controls: readonly Control[]
  risks: readonly RiskItem[]
  stats: AppDataStats
  settings: AppSettings
  generatedAt?: Date
}

function controlNameById(controls: readonly Control[], controlId: string): string {
  return controls.find((control) => control.id === controlId)?.name ?? controlId
}

export function buildMarkdownReport({
  project,
  evidenceItems,
  controls,
  risks,
  stats,
  settings,
  generatedAt = new Date(),
}: MarkdownReportInput): string {
  const openGaps = risks.filter((risk) => risk.status === 'open' || risk.status === 'in_progress')
  const generatedDate = formatDate(generatedAt.toISOString())

  const lines: string[] = [
    `# ${project.projectName}`,
    '',
    '## Pack overview',
    '',
    `- **Client:** ${project.clientName}`,
    `- **Pack type:** ${project.packType}`,
    `- **Generated:** ${generatedDate}`,
    `- **Readiness:** ${stats.readinessPercent}%`,
    `- **Controls covered:** ${stats.controlsCovered} / ${stats.applicableControls}`,
    `- **Evidence count:** ${stats.totalEvidence}`,
    `- **Open gaps:** ${stats.openGaps}`,
    `- **High / critical gaps:** ${stats.highCriticalGaps}`,
    '',
    '## Executive summary',
    '',
    project.description?.trim()
      ? project.description.trim()
      : `${project.clientName} evidence pack prepared with ${stats.totalEvidence} evidence item(s), ${stats.controlsCovered} covered control(s), and ${stats.openGaps} open gap(s).`,
    '',
    '## Control coverage',
    '',
    '| Control | Category | Status | Risk | Linked evidence |',
    '| --- | --- | --- | --- | --- |',
    ...controls.map((control) => (
      `| ${control.name} | ${control.category} | ${control.status} | ${control.riskLevel} | ${control.linkedEvidenceIds.length} |`
    )),
    '',
    '## Open gaps',
    '',
  ]

  if (openGaps.length === 0) {
    lines.push('No open gaps recorded.')
  } else {
    lines.push(
      '| Risk | Severity | Status | Related control | Recommendation |',
      '| --- | --- | --- | --- | --- |',
      ...openGaps.map((risk) => (
        `| ${risk.title} | ${risk.severity} | ${risk.status} | ${risk.relatedControlId ? controlNameById(controls, risk.relatedControlId) : '—'} | ${risk.recommendation ?? '—'} |`
      )),
    )
  }

  lines.push('', '## Risks', '')

  if (risks.length === 0) {
    lines.push('No risks recorded.')
  } else {
    lines.push(
      '| Risk | Severity | Status | Related control | Description |',
      '| --- | --- | --- | --- | --- |',
      ...risks.map((risk) => (
        `| ${risk.title} | ${risk.severity} | ${risk.status} | ${risk.relatedControlId ? controlNameById(controls, risk.relatedControlId) : '—'} | ${risk.description ?? '—'} |`
      )),
    )
  }

  lines.push('', '## Evidence appendix', '')

  if (evidenceItems.length === 0) {
    lines.push('No evidence items recorded.')
  } else {
    lines.push(
      '| Title | Category | Status | Owner | Date | File | Linked controls |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...evidenceItems.map((item) => (
        `| ${item.title} | ${categoryLabels[item.category]} | ${statusLabels[item.status]} | ${item.owner ?? '—'} | ${formatDate(item.evidenceDate)} | ${item.fileName ?? '—'} | ${item.linkedControlIds.map((id) => controlNameById(controls, id)).join('; ') || '—'} |`
      )),
    )
  }

  if (settings.reportFooterText.trim()) {
    lines.push('', '---', '', settings.reportFooterText.trim())
  }

  lines.push('', '## Disclaimer', '', DISCLAIMER, '')
  return lines.join('\n')
}
