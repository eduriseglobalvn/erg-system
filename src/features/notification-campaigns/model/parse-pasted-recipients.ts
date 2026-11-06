/** Backend cap on lines per resolve call (400 above it). */
export const MAX_PASTED_LINES = 5000;

/** One code, email or phone per line; ; , and tab also separate. Trimmed, blanks and repeats dropped. */
export function parsePastedRecipients(text: string): string[] {
  return [...new Set(text.split(/[\n\r;,\t]+/).map((s) => s.trim()).filter(Boolean))];
}

export function capLines(lines: string[]): { lines: string[]; dropped: number } {
  return { lines: lines.slice(0, MAX_PASTED_LINES), dropped: Math.max(0, lines.length - MAX_PASTED_LINES) };
}

/** First column of the first sheet. The xlsx library is loaded on demand so it never reaches the main bundle. */
export async function readRecipientsFromXlsx(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  return [...new Set(rows.map((row) => String(row[0] ?? "").trim()).filter(Boolean))];
}

/** .xlsx / .xls through the lazy reader; anything else is read as text (csv, txt). */
export async function readRecipientsFromFile(file: File): Promise<string[]> {
  return /\.xlsx?$/i.test(file.name) ? readRecipientsFromXlsx(file) : parsePastedRecipients(await file.text());
}
