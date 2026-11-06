import { expect, test } from "vitest";

import { MAX_PASTED_LINES, capLines, parsePastedRecipients, readRecipientsFromFile } from "./parse-pasted-recipients";

test("splits on newline, ; , and tab, trims, drops blanks and duplicates", () => {
  expect(parsePastedRecipients("HS0712\nminh@erg.edu.vn; 0912 000 111\t\nHS0712\n\n")).toEqual([
    "HS0712",
    "minh@erg.edu.vn",
    "0912 000 111",
  ]);
});

test("caps the list at 5,000 lines and reports the dropped count", () => {
  const lines = Array.from({ length: MAX_PASTED_LINES + 3 }, (_, i) => `HS${i}`);
  expect(capLines(lines)).toEqual({ lines: lines.slice(0, MAX_PASTED_LINES), dropped: 3 });
  expect(capLines(["a"])).toEqual({ lines: ["a"], dropped: 0 });
});

test("reads .csv / .txt files without a spreadsheet library", async () => {
  const file = new File(["HS1,HS2\nHS1\n"], "ds.csv", { type: "text/csv" });
  expect(await readRecipientsFromFile(file)).toEqual(["HS1", "HS2"]);
});

async function xlsxFile(rows: unknown[][], name = "ds.xlsx", decorate?: (ws: import("xlsx").WorkSheet) => void) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(rows);
  decorate?.(ws);
  const bytes = XLSX.write({ SheetNames: ["S1"], Sheets: { S1: ws } }, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const file = new File([bytes], name);
  // Older jsdom Files have no arrayBuffer().
  if (!file.arrayBuffer) Object.defineProperty(file, "arrayBuffer", { value: async () => bytes });
  return file;
}

test("xlsx: first column of the first sheet, blanks and repeats dropped, formatted numbers keep their zero", async () => {
  const file = await xlsxFile(
    [["HS0712", "ignored"], [""], [{ t: "n", v: 912000111, z: "0000000000" }], ["HS0712"], ["minh@erg.edu.vn"]],
    "ds.xlsx",
  );
  expect(await readRecipientsFromFile(file)).toEqual(["HS0712", "0912000111", "minh@erg.edu.vn"]);
});

test("xlsx: files over 2 MB are refused before parsing", async () => {
  const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.xlsx");
  await expect(readRecipientsFromFile(big)).rejects.toThrow("Tệp quá lớn (tối đa 2 MB)");
  await expect(readRecipientsFromFile(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.csv"))).rejects.toThrow(/Tệp quá lớn/);
});

test("xlsx: an oversized !ref and a long sheet are clamped to column A and ~5,000 rows", async () => {
  const rows = Array.from({ length: MAX_PASTED_LINES + 500 }, (_, i) => [`HS${i}`, "x", "y"]);
  const lines = await readRecipientsFromFile(await xlsxFile(rows, "many.xlsx"));
  expect(lines).toHaveLength(MAX_PASTED_LINES + 2);
  expect(capLines(lines).dropped).toBe(2);
  const huge = await xlsxFile([["HS1"], ["HS2"]], "ref.xlsx", (ws) => { ws["!ref"] = "A1:C20000"; });
  expect(await readRecipientsFromFile(huge)).toEqual(["HS1", "HS2"]);
});
