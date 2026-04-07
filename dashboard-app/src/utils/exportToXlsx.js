import * as XLSX from 'xlsx';

function sanitizeSheetName(sheetName) {
  const fallback = 'Sheet1';
  const raw = String(sheetName ?? '').trim() || fallback;
  const sanitized = raw.replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31).trim();
  return sanitized || fallback;
}

function toDisplayValue(value) {
  if (value == null) return '';
  return value;
}

function getColumnWidths(matrix) {
  const columnCount = matrix.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  if (columnCount === 0) return [];

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxWidth = matrix.reduce((width, row) => {
      const cell = Array.isArray(row) ? row[columnIndex] : '';
      const text = String(toDisplayValue(cell));
      return Math.max(width, text.length);
    }, 10);

    return { wch: Math.min(Math.max(maxWidth + 2, 10), 60) };
  });
}

export function exportMatrixToXlsx({ fileName, sheetName, rows, merges = [] }) {
  const matrix = Array.isArray(rows) ? rows : [];
  const worksheet = XLSX.utils.aoa_to_sheet(matrix.map((row) => (Array.isArray(row) ? row.map(toDisplayValue) : [])));

  if (merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  const widths = getColumnWidths(matrix);
  if (widths.length > 0) {
    worksheet['!cols'] = widths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));
  const safeFileName = String(fileName ?? 'export.xlsx').trim() || 'export.xlsx';
  XLSX.writeFile(workbook, safeFileName.toLowerCase().endsWith('.xlsx') ? safeFileName : `${safeFileName}.xlsx`);
}
