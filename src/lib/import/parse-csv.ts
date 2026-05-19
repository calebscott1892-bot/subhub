export type ParsedCsvRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type CsvParseResult = {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: string[];
};

export function parseCsv(csvText: string): CsvParseResult {
  const parsedRows = parseRows(csvText.replace(/^\uFEFF/, ""));
  const nonBlankRows = parsedRows.filter((row) =>
    row.cells.some((cell) => cell.trim().length > 0),
  );

  if (nonBlankRows.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: ["CSV file is empty."],
    };
  }

  const headers = nonBlankRows[0].cells.map((header) => header.trim());
  const errors: string[] = [];
  const rows: ParsedCsvRow[] = [];

  for (const row of nonBlankRows.slice(1)) {
    if (row.cells.length !== headers.length) {
      errors.push(
        `Row ${row.rowNumber} has ${row.cells.length} cells but the header has ${headers.length} columns.`,
      );
    }

    rows.push({
      rowNumber: row.rowNumber,
      values: Object.fromEntries(
        headers.map((header, index) => [header, row.cells[index] ?? ""]),
      ),
    });
  }

  return { headers, rows, errors };
}

function parseRows(csvText: string) {
  const rows: Array<{ rowNumber: number; cells: string[] }> = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let lineNumber = 1;
  let rowNumber = 1;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      cells.push(field);
      rows.push({ rowNumber, cells });
      field = "";
      cells = [];

      if (char === "\r" && next === "\n") {
        index += 1;
      }

      lineNumber += 1;
      rowNumber = lineNumber;
      continue;
    }

    field += char;

    if (char === "\n") {
      lineNumber += 1;
    }
  }

  cells.push(field);
  rows.push({ rowNumber, cells });

  return rows;
}
