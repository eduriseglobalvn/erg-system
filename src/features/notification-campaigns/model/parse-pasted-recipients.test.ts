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
