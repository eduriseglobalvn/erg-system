/** Backend cap on lines per resolve call (400 above it). */
export const MAX_PASTED_LINES = 5000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Thrown with a message that is safe to show to the user as is. */
export class RecipientFileError extends Error {}

/** One code, email or phone per line; ; , and tab also separate. Trimmed, blanks and repeats dropped. */
export function parsePastedRecipients(text: string): string[] {
  return [...new Set(text.split(/[\n\r;,\t]+/).map((s) => s.trim()).filter(Boolean))];
}

export function capLines(lines: string[]): { lines: string[]; dropped: number } {
  return { lines: lines.slice(0, MAX_PASTED_LINES), dropped: Math.max(0, lines.length - MAX_PASTED_LINES) };
}

/**
 * First column of the first sheet. The xlsx library is loaded on demand so it never reaches the main bundle.
 * Cells are read as displayed text, so a phone formatted `0000000000` keeps its leading zero; an unformatted
 * numeric phone that Excel already stored without the 0 is not guessed.
 * Bounded: files over 2 MB are refused and only the first column of the first ~5,000 rows is parsed.
 */
async function readRecipientsFromXlsx(file: File): Promise<string[]> {
  if (file.size > MAX_FILE_BYTES) throw new RecipientFileError("Tệp quá lớn (tối đa 2 MB).");
  const XLSX = await import("xlsx");
  const lastRow = MAX_PASTED_LINES + 1; // + header row, + 1 so capLines can still report the overflow
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", sheetRows: lastRow + 1 });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet?.["!ref"]) return [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  sheet["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 0, r: Math.min(range.e.r, lastRow) } });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  return [...new Set(rows.map((row) => String(row[0] ?? "").trim()).filter(Boolean))];
}

/** .xlsx / .xls through the lazy reader; anything else is read as text (csv, txt). */
export async function readRecipientsFromFile(file: File): Promise<string[]> {
  if (/\.xlsx?$/i.test(file.name)) return readRecipientsFromXlsx(file);
  if (file.size > MAX_FILE_BYTES) throw new RecipientFileError("Tệp quá lớn (tối đa 2 MB).");
  return parsePastedRecipients(await file.text());
}
