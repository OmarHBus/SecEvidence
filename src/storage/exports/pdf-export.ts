import type { jsPDF as JsPdf } from 'jspdf'
import { categoryLabels, formatDate, statusLabels } from '../../shared/utils/formatters'
import { EVIDENCE_CATEGORY_FOLDERS } from '../files/file-types'
import { saveExportBlob } from './download-export'
import type { MarkdownReportInput } from './markdown-report'

const DISCLAIMER =
  'SecEvidence helps organize evidence and prepare reports. It does not guarantee compliance and does not replace professional auditing or legal advice.'

const PAGE_MARGIN = 15
const FOOTER_Y = 286
const TEAL: [number, number, number] = [13, 148, 136]
const GRAPHITE: [number, number, number] = [31, 41, 55]
const MUTED: [number, number, number] = [100, 116, 139]
const LIGHT_BORDER: [number, number, number] = [226, 232, 240]

type PdfDocument = JsPdf & {
  lastAutoTable?: { finalY: number }
}

export interface PdfExportDelivery {
  blob: Blob
  fileName: string
  delivery: 'saved' | 'downloaded' | 'cancelled'
}

function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function controlNameById(input: MarkdownReportInput, controlId?: string): string {
  if (!controlId) return '-'
  return input.controls.find((control) => control.id === controlId)?.name ?? controlId
}

function evidenceNameById(input: MarkdownReportInput, evidenceId: string): string {
  return input.evidenceItems.find((item) => item.id === evidenceId)?.title ?? evidenceId
}

function ensureSpace(doc: JsPdf, y: number, requiredHeight = 24): number {
  if (y + requiredHeight <= FOOTER_Y - 8) return y
  doc.addPage()
  return 20
}

function addSectionTitle(doc: JsPdf, title: string, y: number): number {
  const nextY = ensureSpace(doc, y, 18)
  doc.setTextColor(...GRAPHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, PAGE_MARGIN, nextY)
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.8)
  doc.line(PAGE_MARGIN, nextY + 3, PAGE_MARGIN + 22, nextY + 3)
  return nextY + 10
}

function addParagraph(doc: JsPdf, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, 180) as string[]
  const nextY = ensureSpace(doc, y, lines.length * 5 + 4)
  doc.setTextColor(...GRAPHITE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setLineHeightFactor(1.45)
  doc.text(lines, PAGE_MARGIN, nextY)
  return nextY + lines.length * 5 + 5
}

function addEmptyState(doc: JsPdf, text: string, y: number): number {
  const nextY = ensureSpace(doc, y, 14)
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(...LIGHT_BORDER)
  doc.roundedRect(PAGE_MARGIN, nextY - 5, 180, 12, 2, 2, 'FD')
  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.text(text, PAGE_MARGIN + 4, nextY + 2)
  return nextY + 13
}

function tableEndY(doc: PdfDocument): number {
  return (doc.lastAutoTable?.finalY ?? 20) + 10
}

function addPageFooters(doc: JsPdf, footerText: string): void {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...LIGHT_BORDER)
    doc.setLineWidth(0.2)
    doc.line(PAGE_MARGIN, FOOTER_Y - 3, 195, FOOTER_Y - 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(footerText || 'SecEvidence Security Evidence Pack', PAGE_MARGIN, FOOTER_Y + 1)
    doc.text(`Page ${page} of ${pageCount}`, 195, FOOTER_Y + 1, { align: 'right' })
  }
}

const sharedTableStyles = {
  theme: 'grid' as const,
  margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 17 },
  styles: {
    font: 'helvetica',
    fontSize: 7,
    textColor: GRAPHITE,
    lineColor: LIGHT_BORDER,
    lineWidth: 0.15,
    cellPadding: 2.2,
    overflow: 'linebreak' as const,
    valign: 'middle' as const,
  },
  headStyles: {
    fillColor: GRAPHITE,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] as [number, number, number],
  },
}

export async function buildPdfReport(input: MarkdownReportInput): Promise<Uint8Array> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const {
    project,
    evidenceItems,
    controls,
    risks,
    stats,
    settings,
    generatedAt = new Date(),
  } = input
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }) as PdfDocument
  const generatedDate = formatDate(generatedAt.toISOString())
  const openGaps = risks.filter((risk) => risk.status === 'open' || risk.status === 'in_progress')

  doc.setProperties({
    title: `${project.projectName} - Security Evidence Pack`,
    subject: 'Security Evidence Pack',
    author: settings.consultantCompanyName || 'SecEvidence',
    creator: 'SecEvidence',
  })

  doc.setFillColor(...GRAPHITE)
  doc.rect(0, 0, 210, 62, 'F')
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, 6, 297, 'F')
  doc.setTextColor(94, 234, 212)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('SECEVIDENCE', 20, 27)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(25)
  doc.text('Security Evidence Pack', 20, 43)

  doc.setTextColor(...GRAPHITE)
  doc.setFontSize(18)
  doc.text(project.projectName, 20, 89)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  doc.text(project.clientName, 20, 99)

  const coverRows = [
    ['Client / Organization', project.clientName],
    ['Project name', project.projectName],
    ['Pack type', project.packType],
    ['Generated date', generatedDate],
  ]
  autoTable(doc, {
    ...sharedTableStyles,
    startY: 119,
    body: coverRows,
    theme: 'plain',
    styles: { ...sharedTableStyles.styles, fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 48, textColor: MUTED, fontStyle: 'bold' },
      1: { textColor: GRAPHITE },
    },
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Generated locally by SecEvidence', 20, 265)

  doc.addPage()
  let y = addSectionTitle(doc, 'Executive Summary', 22)
  const summary = project.description?.trim()
    ? `${project.description.trim()} Current pack readiness is ${stats.readinessPercent}%, with ${stats.controlsCovered} of ${stats.applicableControls} applicable controls covered.`
    : `${project.clientName}'s ${project.packType} is currently ${stats.readinessPercent}% ready. The pack contains ${stats.totalEvidence} evidence item(s), with ${stats.controlsCovered} of ${stats.applicableControls} applicable controls covered and ${stats.openGaps} open gap(s).`
  y = addParagraph(doc, summary, y)

  autoTable(doc, {
    ...sharedTableStyles,
    startY: y,
    head: [['Readiness', 'Controls covered', 'Evidence total', 'Open gaps', 'High / critical']],
    body: [[
      `${stats.readinessPercent}%`,
      `${stats.controlsCovered} / ${stats.applicableControls}`,
      String(stats.totalEvidence),
      String(stats.openGaps),
      String(stats.highCriticalGaps),
    ]],
    styles: { ...sharedTableStyles.styles, fontSize: 8.5, halign: 'center' },
    bodyStyles: { fontStyle: 'bold', textColor: TEAL },
  })
  y = tableEndY(doc)

  y = addSectionTitle(doc, 'Control Coverage', y)
  if (controls.length === 0) {
    y = addEmptyState(doc, 'No controls have been added to this project.', y)
  } else {
    autoTable(doc, {
      ...sharedTableStyles,
      startY: y,
      head: [['Control', 'Status', 'Category', 'Linked evidence', 'Risk']],
      body: controls.map((control) => [
        control.name,
        humanize(control.status),
        categoryLabels[control.category],
        control.linkedEvidenceIds.map((id) => evidenceNameById(input, id)).join(', ') || '-',
        humanize(control.riskLevel),
      ]),
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 24 },
        2: { cellWidth: 31 },
        3: { cellWidth: 61 },
        4: { cellWidth: 22 },
      },
    })
    y = tableEndY(doc)
  }

  y = addSectionTitle(doc, 'Evidence Summary', y)
  if (evidenceItems.length === 0) {
    y = addEmptyState(doc, 'No evidence has been added to this project.', y)
  } else {
    autoTable(doc, {
      ...sharedTableStyles,
      startY: y,
      head: [['Evidence', 'Category', 'Status', 'Linked controls', 'File', 'Owner / Date']],
      body: evidenceItems.map((item) => [
        item.title,
        categoryLabels[item.category],
        statusLabels[item.status],
        item.linkedControlIds.map((id) => controlNameById(input, id)).join(', ') || '-',
        item.fileName || '-',
        [item.owner, formatDate(item.evidenceDate)].filter((value) => value && value !== '-').join(' / ') || '-',
      ]),
      styles: { ...sharedTableStyles.styles, fontSize: 6.7 },
      columnStyles: {
        0: { cellWidth: 33 },
        1: { cellWidth: 27 },
        2: { cellWidth: 22 },
        3: { cellWidth: 42 },
        4: { cellWidth: 30 },
        5: { cellWidth: 26 },
      },
    })
    y = tableEndY(doc)
  }

  y = addSectionTitle(doc, 'Open Gaps / Risks', y)
  if (openGaps.length === 0) {
    y = addEmptyState(doc, 'No open or in-progress gaps are recorded.', y)
  } else {
    autoTable(doc, {
      ...sharedTableStyles,
      startY: y,
      head: [['Title', 'Severity', 'Related control', 'Recommendation', 'Status']],
      body: openGaps.map((risk) => [
        risk.title,
        humanize(risk.severity),
        controlNameById(input, risk.relatedControlId),
        risk.recommendation || '-',
        humanize(risk.status),
      ]),
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 36 },
        3: { cellWidth: 65 },
        4: { cellWidth: 24 },
      },
    })
    y = tableEndY(doc)
  }

  y = addSectionTitle(doc, 'Evidence Appendix', y)
  if (evidenceItems.length === 0) {
    y = addEmptyState(doc, 'No evidence files are listed in this pack.', y)
  } else {
    autoTable(doc, {
      ...sharedTableStyles,
      startY: y,
      head: [['#', 'Evidence', 'Category', 'Pack file path']],
      body: evidenceItems.map((item, index) => [
        String(index + 1),
        item.title,
        categoryLabels[item.category],
        item.fileName
          ? `evidence/${EVIDENCE_CATEGORY_FOLDERS[item.category]}/${item.fileName}`
          : 'No file attached',
      ]),
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 40 },
        3: { cellWidth: 75 },
      },
    })
    y = tableEndY(doc)
  }

  y = addSectionTitle(doc, 'Disclaimer', y)
  y = addParagraph(doc, DISCLAIMER, y)
  if (settings.reportFooterText.trim()) {
    y = addSectionTitle(doc, 'Report Notes', y)
    addParagraph(doc, settings.reportFooterText.trim(), y)
  }

  addPageFooters(doc, settings.consultantCompanyName.trim())
  return new Uint8Array(doc.output('arraybuffer'))
}

export async function buildPdfBlob(input: MarkdownReportInput): Promise<Blob> {
  const bytes = await buildPdfReport(input)
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

export async function exportPdfReport(
  input: MarkdownReportInput,
  fileName: string,
): Promise<PdfExportDelivery> {
  const blob = await buildPdfBlob(input)
  const delivery = await saveExportBlob(blob, fileName, {
    name: 'PDF document',
    extensions: ['pdf'],
  })
  return { blob, fileName, delivery }
}
