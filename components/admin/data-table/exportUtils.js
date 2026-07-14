// Excel (ExcelJS) + PDF (jsPDF + autoTable) export for DataTable — client-only,
// operates on already-filtered/sorted rows so exports match what's on screen.
'use client'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

function cellValue(col, row) {
  const raw = col.exportValue ? col.exportValue(row) : row[col.key]
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'object') return JSON.stringify(raw)
  return raw
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function exportRowsToExcel(rows, columns, fileName) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  worksheet.columns = columns.map((col) => ({ header: col.label, key: col.key, width: Math.max(col.label.length + 4, 14) }))
  worksheet.addRows(rows.map((row) => Object.fromEntries(columns.map((col) => [col.key, cellValue(col, row)]))))

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6E02D9' } }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${fileName}.xlsx`
  )
}

export function exportRowsToPDF(rows, columns, fileName, title) {
  const doc = new jsPDF()
  if (title) doc.text(title, 14, 15)

  autoTable(doc, {
    startY: title ? 20 : 12,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((col) => String(cellValue(col, row)))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [110, 2, 217], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`${fileName}.pdf`)
}
