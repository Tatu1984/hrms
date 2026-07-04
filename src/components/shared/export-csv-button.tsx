'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadCsv, type CsvColumn } from '@/lib/export';

interface ExportCsvButtonProps<T> {
  data: T[];
  columns: CsvColumn<T>[];
  filename: string;
  label?: string;
  size?: 'sm' | 'default';
}

/** Client button that exports the given rows to a CSV file. */
export function ExportCsvButton<T>({
  data,
  columns,
  filename,
  label = 'Export CSV',
  size = 'sm',
}: ExportCsvButtonProps<T>) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={() => downloadCsv(filename, data, columns)}
      disabled={!data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
