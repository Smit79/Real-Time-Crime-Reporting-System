const normalizeCell = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/\r?\n|\r/g, ' ');
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const downloadCsv = ({ filename = 'export.csv', columns = [], rows = [] }) => {
  if (!Array.isArray(columns) || columns.length === 0) return;

  const header = columns.map((column) => normalizeCell(column.label || column.key)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = typeof column.value === 'function' ? column.value(row) : row?.[column.key];
          return normalizeCell(value);
        })
        .join(',')
    )
    .join('\n');

  const csvContent = [header, body].filter(Boolean).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};
