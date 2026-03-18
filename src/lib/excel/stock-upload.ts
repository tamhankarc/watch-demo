import * as XLSX from "xlsx";

export type ParsedStockRow = {
  rowNumber: number;
  brand: string;
  model: string;
  referenceNumber: string;
  serialNumber: string;
  dateReceived: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // Already a JS Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  // Excel serial number
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
    }
  }

  // String date like 2026-03-18
  const str = String(value).trim();
  const asDate = new Date(str);
  if (!isNaN(asDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  return str;
}

export function parseStockUpload(buffer: Buffer): ParsedStockRow[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: true,
  });

  return json.map((row, index) => ({
    rowNumber: index + 2,
    brand: String(row["Brand"] || "").trim(),
    model: String(row["Model"] || "").trim(),
    referenceNumber: String(row["Reference Number"] || "").trim(),
    serialNumber: String(row["Serial Number"] || "").trim(),
    dateReceived: normalizeExcelDate(row["Date Received"]),
  }));
}