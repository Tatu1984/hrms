// Lightweight client-side export helpers (CSV download + print-to-PDF).
// No external deps: CSV is generated inline; "PDF" uses the browser's print
// dialog (Save as PDF) on a clean, isolated report window.

export interface CsvColumn<T> {
  key: keyof T | string;
  label: string;
  /** Optional formatter for the cell value. */
  format?: (row: T) => string | number;
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download an array of rows as a CSV file (Excel-friendly, UTF-8 BOM). */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns?: CsvColumn<T>[],
): void {
  const cols: CsvColumn<T>[] =
    columns ??
    (rows[0]
      ? Object.keys(rows[0] as Record<string, unknown>).map((k) => ({ key: k, label: k }))
      : []);

  const header = cols.map((c) => csvEscape(c.label)).join(',');
  const body = rows
    .map((row) =>
      cols
        .map((c) => csvEscape(c.format ? c.format(row) : (row as Record<string, unknown>)[c.key as string]))
        .join(','),
    )
    .join('\r\n');

  const csv = `${header}\r\n${body}`;
  const stamped = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  triggerDownload(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' }), stamped);
}

/**
 * Open a clean, isolated window containing `bodyHtml` and trigger the print
 * dialog so the user can Save as PDF. Used for financial statements where a
 * printable/PDF copy is expected.
 */
export function printReport(title: string, bodyHtml: string): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title><meta charset="utf-8"/>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; margin: 32px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
      th { background: #f8fafc; font-weight: 600; }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
      tfoot td { font-weight: 700; border-top: 2px solid #cbd5e1; }
      @media print { body { margin: 12mm; } }
    </style></head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  // Give the new window a tick to render before printing.
  setTimeout(() => w.print(), 300);
}
