const CSV_SEPARATOR = ";";

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value).replaceAll(/\r?\n/g, " | ");
  if (/[";]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }

  return text;
}

export function toCsv(
  rows: Record<string, unknown>[],
  options?: { omit?: readonly string[] },
): string {
  if (rows.length === 0) {
    return "";
  }

  const omitted = new Set(options?.omit ?? []);
  const columns = Object.keys(rows[0]).filter((column) => !omitted.has(column));
  const header = columns.map(escapeCsvValue).join(CSV_SEPARATOR);
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column])).join(CSV_SEPARATOR),
  );

  return `\uFEFF${[header, ...lines].join("\r\n")}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
