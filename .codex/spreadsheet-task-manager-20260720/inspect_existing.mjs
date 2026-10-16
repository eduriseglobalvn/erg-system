import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = "D:/ERG/erg-system/outputs/task_manager_20260720_erg/ERG_Task_Management_System.xlsx";
const outDir = "D:/ERG/erg-system/.codex/spreadsheet-task-manager-20260720/existing_previews";
await fs.mkdir(outDir, { recursive: true });
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
console.log(wb.help("worksheet.name", { include: "index,examples,notes", maxChars: 4000 }).ndjson);
const summary = await wb.inspect({ kind: "workbook,sheet,table", maxChars: 10000, tableMaxRows: 8, tableMaxCols: 10 });
await fs.writeFile(path.join(outDir, "summary.ndjson"), summary.ndjson ?? "", "utf8");
for (const spec of [
  ["BE", "A1:AC14", "be.png", 0.75],
  ["Frontend", "A1:AC14", "frontend.png", 0.75],
  ["Dashboard", "A1:P44", "dashboard.png", 1.0],
]) {
  const blob = await wb.render({ sheetName: spec[0], range: spec[1], scale: spec[3], format: "png" });
  await fs.writeFile(path.join(outDir, spec[2]), new Uint8Array(await blob.arrayBuffer()));
}
console.log(JSON.stringify({ summary: path.join(outDir, "summary.ndjson"), outDir }));
