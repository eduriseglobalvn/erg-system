import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const taskDir = "D:/ERG/erg-system/.codex/spreadsheet-task-manager-20260720";
const outputDir = "D:/ERG/erg-system/outputs/task_manager_20260720_erg_v2";
const previewDir = path.join(taskDir, "previews");

const C = {
  navy: "#0F172A",
  slate: "#475569",
  muted: "#64748B",
  line: "#CBD5E1",
  panel: "#F8FAFC",
  blue: "#2563EB",
  cyan: "#0891B2",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  purple: "#7C3AED",
  white: "#FFFFFF",
  softBlue: "#DBEAFE",
  softGreen: "#DCFCE7",
  softAmber: "#FEF3C7",
  softRed: "#FEE2E2",
  softPurple: "#EDE9FE",
};

const wb = Workbook.create();
const guide = wb.worksheets.add("Hướng dẫn");
const dashboard = wb.worksheets.add("Dashboard");
const backend = wb.worksheets.add("Backend");
const fe = wb.worksheets.add("Frontend");
const sprint = wb.worksheets.add("Sprint");
const report = wb.worksheets.add("Báo cáo");
const raid = wb.worksheets.add("RAID");
const config = wb.worksheets.add("Cấu hình");

function setTitle(sheet, range, title, subtitleRange, subtitle) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format = {
    fill: C.navy,
    font: { bold: true, color: C.white, size: 20 },
    verticalAlignment: "center",
  };
  sheet.getRange(range).format.rowHeight = 32;
  sheet.getRange(subtitleRange).merge();
  sheet.getRange(subtitleRange).values = [[subtitle]];
  sheet.getRange(subtitleRange).format = {
    fill: C.panel,
    font: { color: C.slate, italic: true, size: 10 },
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.getRange(subtitleRange).format.rowHeight = 28;
}

function sectionHeader(sheet, range, text) {
  sheet.getRange(range).merge();
  sheet.getRange(range).values = [[text]];
  sheet.getRange(range).format = {
    fill: C.slate,
    font: { bold: true, color: C.white, size: 11 },
    verticalAlignment: "center",
  };
  sheet.getRange(range).format.rowHeight = 22;
}

function styleTableHeader(range) {
  range.format = {
    fill: C.navy,
    font: { bold: true, color: C.white, size: 9 },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    borders: { preset: "inside", style: "thin", color: "#334155" },
  };
  range.format.rowHeight = 34;
}

function styleCard(sheet, range, labelCell, valueCell, label, formula, accent, numberFormat = "#,##0") {
  const block = sheet.getRange(range);
  block.format = {
    fill: C.white,
    borders: { preset: "outside", style: "thin", color: C.line },
  };
  sheet.getRange(labelCell).values = [[label]];
  sheet.getRange(labelCell).format = { font: { bold: true, color: C.muted, size: 9 } };
  sheet.getRange(valueCell).formulas = [[formula]];
  sheet.getRange(valueCell).format = { font: { bold: true, color: accent, size: 20 } };
  sheet.getRange(valueCell).format.numberFormat = numberFormat;
}

function addStatusFormatting(sheet, range) {
  const r = sheet.getRange(range);
  r.conditionalFormats.add("containsText", { text: "Done", format: { fill: C.softGreen, font: { color: C.green, bold: true } } });
  r.conditionalFormats.add("containsText", { text: "Blocked", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
  r.conditionalFormats.add("containsText", { text: "In Progress", format: { fill: C.softBlue, font: { color: C.blue, bold: true } } });
  r.conditionalFormats.add("containsText", { text: "Code Review", format: { fill: C.softPurple, font: { color: C.purple, bold: true } } });
  r.conditionalFormats.add("containsText", { text: "QA", format: { fill: C.softAmber, font: { color: C.amber, bold: true } } });
}

function setupTaskSheet(sheet, team, tableName, demoRows) {
  setTitle(
    sheet,
    "A1:AC1",
    `${team} — TASK DATABASE`,
    "A2:AC2",
    "Notion-style task database: điền các ô nền trắng, chọn property bằng dropdown; cột nền xám là công thức tự đồng bộ. Thay hoặc xóa các dòng DEMO trước khi dùng thật."
  );
  sheet.getRange("A1:AC1").format = { fill: C.white, font: { bold: true, color: C.navy, size: 20 }, verticalAlignment: "center" };
  sheet.getRange("A2:AC2").format = { fill: C.white, font: { color: C.muted, italic: true, size: 10 }, verticalAlignment: "center", wrapText: true };
  sheet.getRange("A3:AC3").merge();
  sheet.getRange("A3:AC3").values = [["Quy tắc tối thiểu: 1 task = 1 kết quả kiểm chứng được • Luôn có Owner, Priority, Sprint, Estimate và Hạn cam kết • Blocked phải ghi rõ nguyên nhân và người cần hỗ trợ."]];
  sheet.getRange("A3:AC3").format = {
    fill: C.softAmber,
    font: { color: "#92400E", bold: true, size: 9 },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange("A3:AC3").format.rowHeight = 28;

  const teamSheetName = team === "BACKEND" ? "Backend" : "Frontend";
  const statCards = [
    ["A4:B4", "A4", "B4", "TASKS", "=COUNTIF($A$6:$A$205,\"<>\")", C.blue],
    ["D4:E4", "D4", "E4", "DONE", "=COUNTIF($C$6:$C$205,\"Done\")", C.green],
    ["G4:H4", "G4", "H4", "BLOCKED", "=COUNTIF($L$6:$L$205,\"Có\")", C.red],
    ["J4:K4", "J4", "K4", "OVERDUE", "=COUNTIF($V$6:$V$205,\">0\")", C.amber],
    ["M4:N4", "M4", "N4", "SCOPE SP", "=SUM($J$6:$J$205)", C.purple],
  ];
  for (const [block, labelCell, valueCell, label, formula, accent] of statCards) {
    sheet.getRange(block).format = { fill: C.white, borders: { preset: "outside", style: "thin", color: C.line } };
    sheet.getRange(labelCell).values = [[label]];
    sheet.getRange(labelCell).format = { fill: "#F5F5F4", font: { bold: true, color: C.muted, size: 8 }, verticalAlignment: "center" };
    sheet.getRange(valueCell).formulas = [[formula]];
    sheet.getRange(valueCell).format = { font: { bold: true, color: accent, size: 13 }, horizontalAlignment: "center", verticalAlignment: "center" };
  }
  sheet.getRange("P4:AC4").merge();
  sheet.getRange("P4:AC4").values = [["▦  DATABASE VIEW   •   dùng ▼ để filter/sort   •   nhập task ở dòng trống đầu tiên"]];
  sheet.getRange("P4:AC4").format = { fill: C.panel, font: { color: C.slate, size: 9 }, verticalAlignment: "center", wrapText: true, borders: { preset: "outside", style: "thin", color: C.line } };
  sheet.getRange("A4:AC4").format.rowHeight = 24;

  const headers = [[
    "Task ID", "Tiêu đề", "Trạng thái", "Ưu tiên", "Owner", "Sprint", "Loại", "Epic", "Hạn cam kết",
    "Estimate (SP)", "Tiến độ %", "Blocked?", "Nhãn", "Mô tả / Acceptance Criteria", "Cập nhật cuối", "Ngày tạo",
    "Bắt đầu", "Hạn SLA", "Hoàn thành", "Actual (giờ)", "Còn lại (ngày)", "Quá hạn (ngày)", "Lý do blocker",
    "Phụ thuộc", "Release", "Môi trường", "Rủi ro", "Người yêu cầu", "Tuổi task (ngày)"
  ]];
  sheet.getRange("A5:AC5").values = headers;
  styleTableHeader(sheet.getRange("A5:AC5"));
  sheet.getRange("A5:AC5").format = { fill: "#F5F5F4", font: { bold: true, color: C.slate, size: 9 }, verticalAlignment: "center", horizontalAlignment: "center", wrapText: true, borders: { bottom: { style: "thin", color: C.line } } };

  const rows = Array.from({ length: 200 }, () => Array(29).fill(null));
  const displayOrder = [0, 3, 6, 5, 8, 7, 2, 1, 12, 15, 17, 20, 26, 4, 27, 10, 11, 13, 14, 16, 18, 19, 21, 22, 23, 24, 25, 9, 28];
  demoRows.forEach((row, idx) => {
    displayOrder.forEach((oldCol, newCol) => { rows[idx][newCol] = row[oldCol]; });
  });
  sheet.getRange("A6:AC205").values = rows;

  sheet.getRange("R6").formulas = [["=IF(OR(P6=\"\",D6=\"\"),\"\",P6+IFERROR(VLOOKUP(D6,'Cấu hình'!$E$12:$G$15,3,FALSE),0))"]];
  sheet.getRange("R6:R205").fillDown();
  sheet.getRange("K6").formulas = [["=IF(A6=\"\",\"\",IFERROR(VLOOKUP(C6,'Cấu hình'!$A$12:$D$19,2,FALSE),0))"]];
  sheet.getRange("K6:K205").fillDown();
  sheet.getRange("U6").formulas = [["=IF(A6=\"\",\"\",IF(S6<>\"\",0,IF(I6<>\"\",I6-TODAY(),IF(R6<>\"\",R6-TODAY(),\"\"))))"]];
  sheet.getRange("U6:U205").fillDown();
  sheet.getRange("V6").formulas = [["=IF(A6=\"\",\"\",IF(S6<>\"\",MAX(0,S6-IF(I6<>\"\",I6,R6)),IF(OR(I6<>\"\",R6<>\"\"),MAX(0,TODAY()-IF(I6<>\"\",I6,R6)),0)))"]];
  sheet.getRange("V6:V205").fillDown();
  sheet.getRange("AC6").formulas = [["=IF(A6=\"\",\"\",IF(P6=\"\",\"\",IF(S6<>\"\",S6-P6,TODAY()-P6)))"]];
  sheet.getRange("AC6:AC205").fillDown();

  sheet.getRange("G6:G205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$I$12:$I$17" } };
  sheet.getRange("D6:D205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$E$12:$E$15" } };
  sheet.getRange("C6:C205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$A$12:$A$19" } };
  sheet.getRange("F6:F205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$K$12:$K$21" } };
  sheet.getRange("E6:E205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$M$12:$M$31" } };
  sheet.getRange("AB6:AB205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$M$12:$M$31" } };
  sheet.getRange("L6:L205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$Q$12:$Q$13" } };
  sheet.getRange("Y6:Y205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$U$12:$U$21" } };
  sheet.getRange("AA6:AA205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$S$12:$S$15" } };
  sheet.getRange("Z6:Z205").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$W$12:$W$15" } };
  sheet.getRange("J6:J205").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 100 } };
  sheet.getRange("T6:T205").dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1000 } };

  sheet.getRange("A6:AC205").format = {
    font: { color: C.navy, size: 9 },
    verticalAlignment: "top",
    borders: { insideHorizontal: { style: "thin", color: "#E2E8F0" } },
  };
  sheet.getRange("B6:B205").format.wrapText = true;
  sheet.getRange("N6:N205").format.wrapText = true;
  sheet.getRange("W6:X205").format.wrapText = true;
  sheet.getRange("K6:K205").format.fill = "#F1F5F9";
  sheet.getRange("R6:R205").format.fill = "#F1F5F9";
  sheet.getRange("U6:V205").format.fill = "#F1F5F9";
  sheet.getRange("AC6:AC205").format.fill = "#F1F5F9";
  sheet.getRange("I6:I205").format.numberFormat = "yyyy-mm-dd";
  sheet.getRange("O6:S205").format.numberFormat = "yyyy-mm-dd";
  sheet.getRange("J6:J205").format.numberFormat = "0.0";
  sheet.getRange("K6:K205").format.numberFormat = "0%";
  sheet.getRange("T6:T205").format.numberFormat = "0.0";
  sheet.getRange("U6:V205").format.numberFormat = "0";
  sheet.getRange("AC6:AC205").format.numberFormat = "0";

  addStatusFormatting(sheet, "C6:C205");
  sheet.getRange("D6:D205").conditionalFormats.add("containsText", { text: "P0", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
  sheet.getRange("D6:D205").conditionalFormats.add("containsText", { text: "P1", format: { fill: C.softAmber, font: { color: "#92400E", bold: true } } });
  sheet.getRange("V6:V205").conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.softRed, font: { color: C.red, bold: true } } });
  sheet.getRange("L6:L205").conditionalFormats.add("containsText", { text: "Có", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
  sheet.getRange("AA6:AA205").conditionalFormats.add("containsText", { text: "Cao", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
  sheet.getRange("K6:K205").conditionalFormats.add("dataBar", { color: C.blue, gradient: true });

  const widths = [15, 34, 16, 14, 18, 14, 13, 17, 13, 11, 12, 11, 18, 42, 14, 13, 13, 12, 13, 12, 13, 13, 28, 18, 14, 14, 11, 17, 14];
  widths.forEach((width, index) => sheet.getRangeByIndexes(0, index, 205, 1).format.columnWidth = width);
  sheet.getRange("A6:AC205").format.rowHeight = 28;
  sheet.freezePanes.freezeRows(5);
  sheet.freezePanes.freezeColumns(2);
  sheet.showGridLines = false;
  const table = sheet.tables.add("A5:AC205", true, tableName);
  table.style = "TableStyleLight1";
  table.showBandedRows = false;
  table.showFilterButton = true;
}

// CONFIGURATION — all lists and thresholds referenced by formulas and validation.
setTitle(config, "A1:W1", "CẤU HÌNH & QUY ƯỚC", "A2:W2", "Chỉ chỉnh các ô nền vàng và danh mục bên dưới. Dashboard, báo cáo, SLA, validation và biểu đồ đều tham chiếu về đây.");
sectionHeader(config, "A4:D4", "THAM SỐ VẬN HÀNH");
config.getRange("A5:B10").values = [
  ["Sprint đang báo cáo", "Sprint 24"],
  ["Ngày bắt đầu sprint", new Date("2026-07-14T00:00:00")],
  ["Ngày kết thúc sprint", new Date("2026-07-27T00:00:00")],
  ["Capacity toàn đội (SP)", 72],
  ["Ngày báo cáo", null],
  ["Ngưỡng task stale (ngày)", 7],
];
config.getRange("C5:D5").values = [["Ngưỡng lệch burndown", 0.1]];
config.getRange("B9").formulas = [["=TODAY()"]];
config.getRange("A5:A10").format = { fill: C.panel, font: { bold: true, color: C.slate } };
config.getRange("B5:B10").format = { fill: C.softAmber, font: { color: C.navy }, borders: { preset: "outside", style: "thin", color: C.line } };
config.getRange("C5").format = { fill: C.panel, font: { bold: true, color: C.slate } };
config.getRange("D5").format = { fill: C.softAmber, font: { color: C.navy }, borders: { preset: "outside", style: "thin", color: C.line } };
config.getRange("B6:B7").format.numberFormat = "yyyy-mm-dd";
config.getRange("B9").format.numberFormat = "yyyy-mm-dd";
config.getRange("D5").format.numberFormat = "0%";
config.getRange("B5").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$K$12:$K$21" } };

config.getRange("A12:D19").values = [
  ["Backlog", 0, "Mở", 1], ["Ready", 0.1, "Mở", 2], ["In Progress", 0.5, "Đang làm", 3], ["Code Review", 0.75, "Đang làm", 4],
  ["QA", 0.85, "Đang làm", 5], ["Blocked", 0.5, "Đang làm", 6], ["Done", 1, "Đóng", 7], ["Cancelled", 1, "Đóng", 8],
];
config.getRange("A11:D11").values = [["Trạng thái", "Tiến độ", "Nhóm", "Thứ tự"]];
styleTableHeader(config.getRange("A11:D11"));
config.getRange("B12:B19").format.numberFormat = "0%";

config.getRange("E11:G15").values = [
  ["Ưu tiên", "Trọng số", "SLA (ngày)"], ["P0 - Critical", 4, 1], ["P1 - High", 3, 3], ["P2 - Medium", 2, 5], ["P3 - Low", 1, 10],
];
styleTableHeader(config.getRange("E11:G11"));
config.getRange("I11:I17").values = [["Loại task"], ["Story"], ["Bug"], ["Task"], ["Spike"], ["Tech debt"], ["Improvement"]];
styleTableHeader(config.getRange("I11:I11"));
config.getRange("K11:K21").values = [["Sprint"], ["Backlog"], ["Sprint 21"], ["Sprint 22"], ["Sprint 23"], ["Sprint 24"], ["Sprint 25"], ["Sprint 26"], ["Sprint 27"], ["Sprint 28"], ["Sprint 29"]];
styleTableHeader(config.getRange("K11:K11"));
config.getRange("M11:M31").values = [["Thành viên"], ["Nguyễn An"], ["Trần Bình"], ["Lê Chi"], ["Phạm Dũng"], ["Hoàng Em"], ["Võ Giang"], ["Đặng Hà"], ["Bùi Khang"], ["PO"], ["QA"], ...Array.from({ length: 10 }, () => [null])];
styleTableHeader(config.getRange("M11:M11"));
config.getRange("Q11:Q13").values = [["Blocked?"], ["Không"], ["Có"]];
styleTableHeader(config.getRange("Q11:Q11"));
config.getRange("S11:S15").values = [["Rủi ro"], ["Thấp"], ["Trung bình"], ["Cao"], ["N/A"]];
styleTableHeader(config.getRange("S11:S11"));
config.getRange("U11:U21").values = [["Release"], ["R2026.07"], ["R2026.08"], ["R2026.09"], ["R2026.Q4"], ...Array.from({ length: 6 }, () => [null])];
styleTableHeader(config.getRange("U11:U11"));
config.getRange("W11:W15").values = [["Môi trường"], ["Local"], ["Dev"], ["Staging"], ["Production"]];
styleTableHeader(config.getRange("W11:W11"));
config.getRange("A12:W31").format = { font: { size: 9, color: C.navy }, borders: { insideHorizontal: { style: "thin", color: "#E2E8F0" } } };
config.getRange("A:W").format.columnWidth = 14;
config.getRange("A:A").format.columnWidth = 24;
config.getRange("B:B").format.columnWidth = 16;
config.getRange("M:M").format.columnWidth = 20;
config.freezePanes.freezeRows(2);
config.showGridLines = false;

const d = (offset) => new Date(Date.UTC(2026, 6, 20 + offset));
const backendDemo = [
  ["DEMO-BE-001", "Authentication", "Story", "Refresh token an toàn", "Token được rotate; revoke khi logout; có test happy path và expired token.", "P0 - Critical", "In Progress", "Sprint 24", "Nguyễn An", "PO", d(-8), d(-6), d(2), null, null, 8, 10, null, null, null, "Không", null, null, "R2026.07", "Staging", "Cao", "auth,security", d(-1)],
  ["DEMO-BE-002", "Enrollment", "Bug", "Không đồng bộ trạng thái ghi danh", "API trả đúng trạng thái sau retry; không tạo bản ghi trùng.", "P1 - High", "QA", "Sprint 24", "Trần Bình", "QA", d(-7), d(-5), d(0), null, null, 5, 6, null, null, null, "Không", null, "DEMO-BE-001", "R2026.07", "Staging", "Trung bình", "enrollment", d(0)],
  ["DEMO-BE-003", "Reporting", "Task", "API tổng hợp tiến độ học", "P95 < 500ms với dữ liệu kiểm thử; schema được tài liệu hóa.", "P2 - Medium", "Code Review", "Sprint 24", "Lê Chi", "PO", d(-6), d(-4), d(3), null, null, 5, 4, null, null, null, "Không", null, null, "R2026.08", "Dev", "Thấp", "reporting", d(-1)],
  ["DEMO-BE-004", "Notification", "Tech debt", "Chuẩn hóa retry queue", "Có exponential backoff; dead-letter queue có metric.", "P2 - Medium", "Blocked", "Sprint 24", "Phạm Dũng", "PO", d(-5), d(-3), d(4), null, null, 8, 3, null, null, null, "Có", "Chờ quyền truy cập message broker", "OPS-014", "R2026.08", "Dev", "Cao", "queue", d(-2)],
  ["DEMO-BE-005", "Profile", "Story", "API cập nhật hồ sơ", "Validate dữ liệu; audit updated_by; test 400/403/200.", "P3 - Low", "Ready", "Sprint 24", "Nguyễn An", "PO", d(-4), null, d(6), null, null, 3, null, null, null, null, "Không", null, null, "R2026.08", "Dev", "Thấp", "profile", d(-3)],
  ["DEMO-BE-006", "Observability", "Task", "Bổ sung tracing cho payment webhook", "Trace ID xuyên suốt; cảnh báo khi error rate vượt ngưỡng.", "P1 - High", "Done", "Sprint 24", "Trần Bình", "PO", d(-10), d(-9), d(-2), null, d(-2), 5, 7, null, null, null, "Không", null, null, "R2026.07", "Production", "Trung bình", "observability", d(-2)],
];
const feDemo = [
  ["DEMO-FE-001", "Authentication", "Story", "Màn hình đăng nhập và phiên hết hạn", "Có lỗi inline; focus hợp lý; tự chuyển về login khi session hết hạn.", "P0 - Critical", "Code Review", "Sprint 24", "Hoàng Em", "PO", d(-8), d(-6), d(1), null, null, 5, 8, null, null, null, "Không", null, "DEMO-BE-001", "R2026.07", "Staging", "Cao", "auth,a11y", d(0)],
  ["DEMO-FE-002", "Dashboard", "Story", "Dashboard tiến độ học viên", "Skeleton loading; responsive; số liệu khớp API; empty state rõ ràng.", "P1 - High", "In Progress", "Sprint 24", "Võ Giang", "PO", d(-7), d(-5), d(3), null, null, 8, 12, null, null, null, "Không", null, "DEMO-BE-003", "R2026.08", "Dev", "Trung bình", "dashboard", d(-1)],
  ["DEMO-FE-003", "Enrollment", "Bug", "Bộ lọc ghi danh mất trạng thái", "Reload vẫn giữ filter; URL search params được đồng bộ.", "P1 - High", "QA", "Sprint 24", "Đặng Hà", "QA", d(-6), d(-4), d(0), null, null, 3, 5, null, null, null, "Không", null, null, "R2026.07", "Staging", "Trung bình", "router", d(0)],
  ["DEMO-FE-004", "Design system", "Improvement", "Chuẩn hóa status badge", "Chỉ dùng ERG MUI token; đủ trạng thái success/warning/error/info.", "P2 - Medium", "Blocked", "Sprint 24", "Bùi Khang", "PO", d(-5), d(-3), d(5), null, null, 5, 2, null, null, null, "Có", "Chờ xác nhận mapping trạng thái", "PO-DEC-002", "R2026.08", "Dev", "Trung bình", "mui", d(-2)],
  ["DEMO-FE-005", "Profile", "Task", "Form cập nhật hồ sơ", "Validation client/server; hiển thị lỗi field; keyboard accessible.", "P3 - Low", "Ready", "Sprint 24", "Hoàng Em", "PO", d(-4), null, d(6), null, null, 3, null, null, null, null, "Không", null, "DEMO-BE-005", "R2026.08", "Dev", "Thấp", "form", d(-3)],
  ["DEMO-FE-006", "Shell", "Tech debt", "Tách bundle route báo cáo", "Route được lazy-load; initial bundle không tăng; có skeleton.", "P2 - Medium", "Done", "Sprint 24", "Võ Giang", "PO", d(-10), d(-9), d(-3), null, d(-3), 3, 4, null, null, null, "Không", null, null, "R2026.07", "Production", "Thấp", "performance", d(-3)],
];

setupTaskSheet(backend, "BACKEND", "BackendTasks", backendDemo);
setupTaskSheet(fe, "FRONTEND", "FrontendTasks", feDemo);

// DASHBOARD
  setTitle(dashboard, "A1:P1", "DASHBOARD ĐIỀU HÀNH SPRINT", "A2:P2", "Tự động tổng hợp từ hai tab Backend và Frontend. Đổi Sprint đang báo cáo tại tab Cấu hình để đồng bộ toàn bộ workbook.");
dashboard.getRange("A4:B4").values = [["Sprint đang xem", null]];
dashboard.getRange("C4").formulas = [["='Cấu hình'!B5"]];
dashboard.getRange("F4:G4").values = [["Ngày báo cáo", null]];
dashboard.getRange("H4").formulas = [["='Cấu hình'!B9"]];
dashboard.getRange("C4").format = { fill: C.softBlue, font: { bold: true, color: C.blue } };
dashboard.getRange("H4").format = { fill: C.softBlue, font: { bold: true, color: C.blue }, numberFormat: "yyyy-mm-dd" };

const totalFormula = "=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$A$6:$A$205,\"<>\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$A$6:$A$205,\"<>\")";
const doneFormula = "=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"Done\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"Done\")";
const activeFormula = "=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"In Progress\")+COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"Code Review\")+COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"QA\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"In Progress\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"Code Review\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"QA\")";
const blockedFormula = "=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"Blocked\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"Blocked\")";
const overdueFormula = "=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$V$6:$V$205,\">0\",'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$V$6:$V$205,\">0\",'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\")";
const scopeFormula = "=SUMIFS('Backend'!$J$6:$J$205,'Backend'!$F$6:$F$205,$C$4)+SUMIFS('Frontend'!$J$6:$J$205,'Frontend'!$F$6:$F$205,$C$4)";
const doneSpFormula = "=SUMIFS('Backend'!$J$6:$J$205,'Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,\"Done\")+SUMIFS('Frontend'!$J$6:$J$205,'Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,\"Done\")";
styleCard(dashboard, "A6:C8", "A6", "A7", "TỔNG TASK", totalFormula, C.blue);
styleCard(dashboard, "E6:G8", "E6", "E7", "ĐÃ HOÀN THÀNH", doneFormula, C.green);
styleCard(dashboard, "I6:K8", "I6", "I7", "ĐANG THỰC HIỆN", activeFormula, C.purple);
styleCard(dashboard, "M6:O8", "M6", "M7", "BLOCKED", blockedFormula, C.red);
styleCard(dashboard, "A10:C12", "A10", "A11", "QUÁ HẠN", overdueFormula, C.red);
styleCard(dashboard, "E10:G12", "E10", "E11", "TỶ LỆ HOÀN THÀNH", "=IFERROR(E7/A7,0)", C.green, "0%");
styleCard(dashboard, "I10:K12", "I10", "I11", "PHẠM VI (SP)", scopeFormula, C.blue, "0.0");
styleCard(dashboard, "M10:O12", "M10", "M11", "DONE (SP)", doneSpFormula, C.green, "0.0");

sectionHeader(dashboard, "A14:D14", "PHÂN BỔ TRẠNG THÁI");
dashboard.getRange("A15:B22").values = [["Backlog", null], ["Ready", null], ["In Progress", null], ["Code Review", null], ["QA", null], ["Blocked", null], ["Done", null], ["Cancelled", null]];
for (let row = 15; row <= 22; row++) {
  dashboard.getRange(`B${row}`).formulas = [[`=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$C$6:$C$205,A${row})+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$C$6:$C$205,A${row})`]];
}
dashboard.getRange("A15:B22").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };

sectionHeader(dashboard, "E14:H14", "PHÂN BỔ ƯU TIÊN");
dashboard.getRange("E15:F18").values = [["P0 - Critical", null], ["P1 - High", null], ["P2 - Medium", null], ["P3 - Low", null]];
for (let row = 15; row <= 18; row++) {
  dashboard.getRange(`F${row}`).formulas = [[`=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$D$6:$D$205,E${row})+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$D$6:$D$205,E${row})`]];
}
dashboard.getRange("E15:F18").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };

sectionHeader(dashboard, "A25:H25", "HIỆU SUẤT THEO ĐỘI");
dashboard.getRange("A26:F26").values = [["Đội", "Tổng task", "Done", "Blocked", "Scope SP", "Done SP"]];
styleTableHeader(dashboard.getRange("A26:F26"));
dashboard.getRange("A27:A28").values = [["Backend"], ["Frontend"]];
for (const [row, sheetName] of [[27, "Backend"], [28, "Frontend"]]) {
  dashboard.getRange(`B${row}:F${row}`).formulas = [[
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$A$6:$A$205,\"<>\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Done\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Blocked\")`,
    `=SUMIFS('${sheetName}'!$J$6:$J$205,'${sheetName}'!$F$6:$F$205,$C$4)`,
    `=SUMIFS('${sheetName}'!$J$6:$J$205,'${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Done\")`,
  ]];
}
dashboard.getRange("A27:F28").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };

const statusChart = dashboard.charts.add("doughnut", dashboard.getRange("A14:B22"));
statusChart.title = "Task theo trạng thái";
statusChart.hasLegend = true;
statusChart.setPosition("J14", "P28");
const teamChart = dashboard.charts.add("bar", dashboard.getRange("A26:C28"));
teamChart.title = "Tổng task và Done theo đội";
teamChart.hasLegend = true;
teamChart.xAxis = { axisType: "textAxis" };
teamChart.yAxis = { numberFormatCode: "0" };
teamChart.setPosition("J30", "P44");
dashboard.getRange("A:P").format.columnWidth = 12;
dashboard.getRange("A:A").format.columnWidth = 19;
dashboard.getRange("E:E").format.columnWidth = 19;
dashboard.freezePanes.freezeRows(2);
dashboard.showGridLines = false;

// SPRINT / BURNDOWN
setTitle(sprint, "A1:L1", "SPRINT CONTROL & BURNDOWN", "A2:L2", "Đường Actual Remaining tự tổng hợp SP hoàn thành theo ngày từ hai đội. Mọi tham số lấy từ tab Cấu hình.");
sprint.getRange("A4:B8").values = [["Sprint", null], ["Bắt đầu", null], ["Kết thúc", null], ["Scope SP", null], ["Done SP", null]];
sprint.getRange("B4:B8").formulas = [["='Cấu hình'!B5"], ["='Cấu hình'!B6"], ["='Cấu hình'!B7"], [scopeFormula.replaceAll("$C$4", "$B$4")], [doneSpFormula.replaceAll("$C$4", "$B$4")]];
sprint.getRange("A4:A8").format = { fill: C.panel, font: { bold: true, color: C.slate } };
sprint.getRange("B4:B8").format = { fill: C.softBlue, font: { bold: true, color: C.blue } };
sprint.getRange("B5:B6").format.numberFormat = "yyyy-mm-dd";
sprint.getRange("B7:B8").format.numberFormat = "0.0";
sprint.getRange("D4:E8").values = [["Tiến độ thời gian", null], ["Tiến độ thực tế", null], ["Lệch kế hoạch", null], ["Tình trạng", null], ["Capacity dùng", null]];
sprint.getRange("E4").formulas = [["=MIN(1,MAX(0,(TODAY()-B5)/MAX(1,B6-B5)))"]];
sprint.getRange("E5").formulas = [["=IFERROR(B8/B7,0)"]];
sprint.getRange("E6").formulas = [["=E5-E4"]];
sprint.getRange("F3").values = [["Ngưỡng cảnh báo"]];
sprint.getRange("F4").formulas = [["='Cấu hình'!D5"]];
sprint.getRange("F3:F4").format = { fill: C.panel, font: { color: C.muted, size: 8 } };
sprint.getRange("F4").format.numberFormat = "0%";
sprint.getRange("E7").formulas = [["=IF(E6+F4<0,\"Đỏ - Chậm tiến độ\",IF(E6<0,\"Vàng - Cần theo dõi\",\"Xanh - Đúng kế hoạch\"))"]];
sprint.getRange("E8").formulas = [["=IFERROR(B7/'Cấu hình'!B8,0)"]];
sprint.getRange("D4:D8").format = { fill: C.panel, font: { bold: true, color: C.slate } };
sprint.getRange("E4:E8").format = { fill: C.softBlue, font: { bold: true, color: C.blue } };
sprint.getRange("E4:E6").format.numberFormat = "0%";
sprint.getRange("E8").format.numberFormat = "0%";
sprint.getRange("E7").conditionalFormats.add("containsText", { text: "Đỏ", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
sprint.getRange("E7").conditionalFormats.add("containsText", { text: "Vàng", format: { fill: C.softAmber, font: { color: C.amber, bold: true } } });
sprint.getRange("E7").conditionalFormats.add("containsText", { text: "Xanh", format: { fill: C.softGreen, font: { color: C.green, bold: true } } });

sprint.getRange("A11:E11").values = [["Ngày", "Scope SP", "SP hoàn thành lũy kế", "Ideal Remaining", "Actual Remaining"]];
styleTableHeader(sprint.getRange("A11:E11"));
sprint.getRange("A12").formulas = [["=B5"]];
sprint.getRange("A13").formulas = [["=IF(A12+1<=$B$6,A12+1,\"\")"]];
sprint.getRange("A13:A41").fillDown();
sprint.getRange("B12").formulas = [["=IF(A12=\"\",\"\",$B$7)"]];
sprint.getRange("B12:B41").fillDown();
sprint.getRange("C12").formulas = [["=IF(A12=\"\",\"\",SUMIFS('Backend'!$J$6:$J$205,'Backend'!$F$6:$F$205,$B$4,'Backend'!$C$6:$C$205,\"Done\",'Backend'!$S$6:$S$205,\"<=\"&A12)+SUMIFS('Frontend'!$J$6:$J$205,'Frontend'!$F$6:$F$205,$B$4,'Frontend'!$C$6:$C$205,\"Done\",'Frontend'!$S$6:$S$205,\"<=\"&A12))"]];
sprint.getRange("C12:C41").fillDown();
sprint.getRange("D12").formulas = [["=IF(A12=\"\",\"\",MAX(0,$B$7*(1-(A12-$B$5)/MAX(1,$B$6-$B$5))))"]];
sprint.getRange("D12:D41").fillDown();
sprint.getRange("E12").formulas = [["=IF(A12=\"\",\"\",MAX(0,$B$7-C12))"]];
sprint.getRange("E12:E41").fillDown();
sprint.getRange("A12:A41").format.numberFormat = "yyyy-mm-dd";
sprint.getRange("B12:E41").format.numberFormat = "0.0";
sprint.getRange("A12:E41").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };
// Formula-backed chart helper uses text date labels so renderers do not treat dates as a numeric series.
sprint.getRange("N1:P1").values = [["Ngày", "Ideal Remaining", "Actual Remaining"]];
sprint.getRange("N2").formulas = [["=IF(A12=\"\",\"\",TEXT(A12,\"mm-dd\"))"]];
sprint.getRange("N2:N31").fillDown();
sprint.getRange("O2").formulas = [["=IF(D12=\"\",\"\",D12)"]];
sprint.getRange("O2:O31").fillDown();
sprint.getRange("P2").formulas = [["=IF(E12=\"\",\"\",E12)"]];
sprint.getRange("P2:P31").fillDown();
sprint.getRange("N1:P31").format = { fill: C.panel, font: { color: C.muted, size: 8 } };
const burnChart = sprint.charts.add("line", sprint.getRange("N1:P15"));
burnChart.title = "Burndown — Ideal vs Actual Remaining (SP)";
burnChart.hasLegend = true;
burnChart.xAxis = { axisType: "textAxis" };
burnChart.yAxis = { numberFormatCode: "0.0" };
burnChart.setPosition("G4", "L21");
sprint.getRange("A:L").format.columnWidth = 15;
sprint.getRange("A:A").format.columnWidth = 19;
sprint.freezePanes.freezeRows(2);
sprint.showGridLines = false;

// REPORT
setTitle(report, "A1:N1", "BÁO CÁO QUẢN TRỊ", "A2:N2", "Báo cáo tự động theo sprint đang chọn: tiến độ, khối lượng, chất lượng dữ liệu, rủi ro và tải theo người.");
report.getRange("A4:B4").values = [["Sprint", null]];
report.getRange("C4").formulas = [["='Cấu hình'!B5"]];
report.getRange("A6:K6").values = [["Đội", "Tổng task", "Done", "Đang làm", "Blocked", "Quá hạn", "Hoàn thành %", "Scope SP", "Done SP", "Actual giờ", "Cycle time TB"]];
styleTableHeader(report.getRange("A6:K6"));
report.getRange("A7:A9").values = [["Backend"], ["Frontend"], ["Tổng"]];
for (const [row, sheetName] of [[7, "Backend"], [8, "Frontend"]]) {
  report.getRange(`B${row}:K${row}`).formulas = [[
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$A$6:$A$205,\"<>\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Done\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"In Progress\")+COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Code Review\")+COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"QA\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Blocked\")`,
    `=COUNTIFS('${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$V$6:$V$205,\">0\",'${sheetName}'!$C$6:$C$205,\"<>Done\",'${sheetName}'!$C$6:$C$205,\"<>Cancelled\")`,
    `=IFERROR(C${row}/B${row},0)`,
    `=SUMIFS('${sheetName}'!$J$6:$J$205,'${sheetName}'!$F$6:$F$205,$C$4)`,
    `=SUMIFS('${sheetName}'!$J$6:$J$205,'${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Done\")`,
    `=SUMIFS('${sheetName}'!$T$6:$T$205,'${sheetName}'!$F$6:$F$205,$C$4)`,
    `=IFERROR(SUMIFS('${sheetName}'!$AC$6:$AC$205,'${sheetName}'!$F$6:$F$205,$C$4,'${sheetName}'!$C$6:$C$205,\"Done\")/C${row},0)`,
  ]];
}
for (let col = 2; col <= 11; col++) {
  const letter = String.fromCharCode(64 + col);
  const totalFormula = col === 7
    ? "=IFERROR(C9/B9,0)"
    : col === 11
      ? "=IFERROR((K7*C7+K8*C8)/(C7+C8),0)"
      : `=SUM(${letter}7:${letter}8)`;
  report.getRange(`${letter}9`).formulas = [[totalFormula]];
}
report.getRange("G7:G9").format.numberFormat = "0%";
report.getRange("H7:K9").format.numberFormat = "0.0";
report.getRange("A7:K9").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };
report.getRange("A9:K9").format = { fill: C.panel, font: { bold: true, color: C.navy } };

sectionHeader(report, "A12:E12", "KIỂM SOÁT CHẤT LƯỢNG DỮ LIỆU");
report.getRange("A13:A19").values = [["P0/P1 chưa đóng"], ["Task thiếu Owner"], ["Task thiếu Estimate"], ["Task thiếu hạn cam kết"], ["Task stale"], ["Task quá hạn"], ["Blocked không có lý do"]];
report.getRange("B13").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$D$6:$D$205,\"P0 - Critical\",'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$D$6:$D$205,\"P1 - High\",'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$D$6:$D$205,\"P0 - Critical\",'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$D$6:$D$205,\"P1 - High\",'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\")"]];
report.getRange("B14").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$A$6:$A$205,\"<>\",'Backend'!$E$6:$E$205,\"\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$A$6:$A$205,\"<>\",'Frontend'!$E$6:$E$205,\"\")"]];
report.getRange("B15").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$A$6:$A$205,\"<>\",'Backend'!$J$6:$J$205,\"\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$A$6:$A$205,\"<>\",'Frontend'!$J$6:$J$205,\"\")"]];
report.getRange("B16").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$A$6:$A$205,\"<>\",'Backend'!$I$6:$I$205,\"\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$A$6:$A$205,\"<>\",'Frontend'!$I$6:$I$205,\"\")"]];
report.getRange("B17").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$A$6:$A$205,\"<>\",'Backend'!$O$6:$O$205,\"<\"&TODAY()-'Cấu hình'!$B$10,'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$A$6:$A$205,\"<>\",'Frontend'!$O$6:$O$205,\"<\"&TODAY()-'Cấu hình'!$B$10,'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\")"]];
report.getRange("B18").formulas = [[overdueFormula.replaceAll("$C$4", "$C$4")]];
report.getRange("B19").formulas = [["=COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$L$6:$L$205,\"Có\",'Backend'!$W$6:$W$205,\"\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$L$6:$L$205,\"Có\",'Frontend'!$W$6:$W$205,\"\")"]];
report.getRange("A13:B19").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };
report.getRange("B13:B19").conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.softRed, font: { color: C.red, bold: true } } });

sectionHeader(report, "G12:N12", "TẢI CÔNG VIỆC THEO NGƯỜI");
report.getRange("G13:L13").values = [["Người", "Task mở", "SP mở", "Blocked", "Quá hạn", "Done"]];
styleTableHeader(report.getRange("G13:L13"));
for (let i = 0; i < 20; i++) {
  const row = 14 + i;
  const cfgRow = 12 + i;
  report.getRange(`G${row}`).formulas = [[`=IF('Cấu hình'!M${cfgRow}=\"\",\"\",'Cấu hình'!M${cfgRow})`]];
  report.getRange(`H${row}:L${row}`).formulas = [[
    `=IF(G${row}=\"\",\"\",COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$E$6:$E$205,G${row},'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$E$6:$E$205,G${row},'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\"))`,
    `=IF(G${row}=\"\",\"\",SUMIFS('Backend'!$J$6:$J$205,'Backend'!$F$6:$F$205,$C$4,'Backend'!$E$6:$E$205,G${row},'Backend'!$C$6:$C$205,\"<>Done\",'Backend'!$C$6:$C$205,\"<>Cancelled\")+SUMIFS('Frontend'!$J$6:$J$205,'Frontend'!$F$6:$F$205,$C$4,'Frontend'!$E$6:$E$205,G${row},'Frontend'!$C$6:$C$205,\"<>Done\",'Frontend'!$C$6:$C$205,\"<>Cancelled\"))`,
    `=IF(G${row}=\"\",\"\",COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$E$6:$E$205,G${row},'Backend'!$C$6:$C$205,\"Blocked\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$E$6:$E$205,G${row},'Frontend'!$C$6:$C$205,\"Blocked\"))`,
    `=IF(G${row}=\"\",\"\",COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$E$6:$E$205,G${row},'Backend'!$V$6:$V$205,\">0\",'Backend'!$C$6:$C$205,\"<>Done\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$E$6:$E$205,G${row},'Frontend'!$V$6:$V$205,\">0\",'Frontend'!$C$6:$C$205,\"<>Done\"))`,
    `=IF(G${row}=\"\",\"\",COUNTIFS('Backend'!$F$6:$F$205,$C$4,'Backend'!$E$6:$E$205,G${row},'Backend'!$C$6:$C$205,\"Done\")+COUNTIFS('Frontend'!$F$6:$F$205,$C$4,'Frontend'!$E$6:$E$205,G${row},'Frontend'!$C$6:$C$205,\"Done\"))`,
  ]];
}
report.getRange("G14:L33").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };
report.getRange("I14:I33").format.numberFormat = "0.0";
report.getRange("J14:K33").conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.softRed, font: { color: C.red, bold: true } } });
report.getRange("A:N").format.columnWidth = 14;
report.getRange("A:A").format.columnWidth = 24;
report.getRange("G:G").format.columnWidth = 20;
report.freezePanes.freezeRows(6);
report.showGridLines = false;

// RAID
setTitle(raid, "A1:O1", "RAID — RỦI RO, GIẢ ĐỊNH, VẤN ĐỀ & QUYẾT ĐỊNH", "A2:O2", "Ghi nhận các yếu tố ngoài task nhưng có thể ảnh hưởng delivery. Điểm = Xác suất × Ảnh hưởng; quá hạn và tuổi bản ghi tự tính.");
raid.getRange("A5:O5").values = [["RAID ID", "Loại", "Tiêu đề", "Mô tả", "Xác suất (1-5)", "Ảnh hưởng (1-5)", "Điểm", "Mức", "Owner", "Hạn xử lý", "Trạng thái", "Kế hoạch / Quyết định", "Task liên kết", "Ngày tạo", "Quá hạn (ngày)"]];
styleTableHeader(raid.getRange("A5:O5"));
const raidRows = Array.from({ length: 100 }, () => Array(15).fill(null));
raidRows[0] = ["DEMO-R-001", "Risk", "Chậm quyền truy cập message broker", "Có thể làm trễ retry queue.", 4, 4, null, null, "Phạm Dũng", d(1), "Open", "Escalate OPS và chuẩn bị mock broker.", "DEMO-BE-004", d(-5), null];
raidRows[1] = ["DEMO-D-001", "Decision", "Mapping status badge", "Chọn mapping màu theo ERG MUI status palette.", 1, 3, null, null, "PO", d(0), "Open", "PO xác nhận mapping trước code freeze.", "DEMO-FE-004", d(-3), null];
raid.getRange("A6:O105").values = raidRows;
raid.getRange("G6").formulas = [["=IF(OR(E6=\"\",F6=\"\"),\"\",E6*F6)"]];
raid.getRange("G6:G105").fillDown();
raid.getRange("H6").formulas = [["=IF(G6=\"\",\"\",IF(G6>=16,\"Cao\",IF(G6>=8,\"Trung bình\",\"Thấp\")))"]];
raid.getRange("H6:H105").fillDown();
raid.getRange("O6").formulas = [["=IF(A6=\"\",\"\",IF(OR(J6=\"\",K6=\"Closed\"),0,MAX(0,TODAY()-J6)))"]];
raid.getRange("O6:O105").fillDown();
raid.getRange("B6:B105").dataValidation = { rule: { type: "list", values: ["Risk", "Assumption", "Issue", "Decision"] } };
raid.getRange("E6:F105").dataValidation = { rule: { type: "whole", operator: "between", formula1: 1, formula2: 5 } };
raid.getRange("I6:I105").dataValidation = { rule: { type: "list", formula1: "'Cấu hình'!$M$12:$M$31" } };
raid.getRange("K6:K105").dataValidation = { rule: { type: "list", values: ["Open", "Monitoring", "Mitigated", "Closed"] } };
raid.getRange("G6:H105").format.fill = "#F1F5F9";
raid.getRange("O6:O105").format.fill = "#F1F5F9";
raid.getRange("J6:J105").format.numberFormat = "yyyy-mm-dd";
raid.getRange("N6:N105").format.numberFormat = "yyyy-mm-dd";
raid.getRange("A6:O105").format = { borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy }, verticalAlignment: "top" };
raid.getRange("C6:D105").format.wrapText = true;
raid.getRange("L6:L105").format.wrapText = true;
raid.getRange("H6:H105").conditionalFormats.add("containsText", { text: "Cao", format: { fill: C.softRed, font: { color: C.red, bold: true } } });
raid.getRange("H6:H105").conditionalFormats.add("containsText", { text: "Trung bình", format: { fill: C.softAmber, font: { color: C.amber, bold: true } } });
raid.getRange("O6:O105").conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.softRed, font: { color: C.red, bold: true } } });
const raidWidths = [14, 13, 28, 38, 14, 14, 10, 14, 18, 13, 14, 36, 18, 13, 14];
raidWidths.forEach((width, index) => raid.getRangeByIndexes(0, index, 105, 1).format.columnWidth = width);
raid.getRange("A6:O105").format.rowHeight = 28;
raid.freezePanes.freezeRows(5);
raid.freezePanes.freezeColumns(2);
raid.showGridLines = false;
const raidTable = raid.tables.add("A5:O105", true, "RAIDLog");
raidTable.style = "TableStyleMedium2";

// GUIDE
setTitle(guide, "A1:J1", "HỆ THỐNG QUẢN LÝ CÔNG VIỆC — HƯỚNG DẪN", "A2:J2", "Mục tiêu: một nguồn dữ liệu minh bạch thay cho Jira trong vận hành sprint của đội Backend và Frontend.");
sectionHeader(guide, "A4:J4", "BẮT ĐẦU TRONG 5 PHÚT");
guide.getRange("A5:J9").values = [
  ["1", "Cấu hình", "Điền sprint, ngày bắt đầu/kết thúc, capacity, thành viên, release và môi trường.", null, null, null, null, null, null, null],
  ["2", "Backend / Frontend", "Xóa hoặc thay các dòng DEMO. Mỗi task phải có ID duy nhất, Owner, Priority, Sprint, Estimate và Hạn cam kết.", null, null, null, null, null, null, null],
  ["3", "Daily", "Cập nhật Trạng thái, Actual giờ, Blocked, Lý do blocker và Cập nhật cuối. Không sửa các cột công thức nền xám.", null, null, null, null, null, null, null],
  ["4", "Dashboard / Sprint", "Theo dõi tiến độ, blocked, overdue, scope, burndown. Dùng cùng một Sprint đang báo cáo trong Cấu hình.", null, null, null, null, null, null, null],
  ["5", "Báo cáo / RAID", "Review chất lượng dữ liệu, tải theo người, rủi ro, quyết định và hành động trước Sprint Review.", null, null, null, null, null, null, null],
];
guide.getRange("A5:A9").format = { fill: C.blue, font: { bold: true, color: C.white, size: 14 }, horizontalAlignment: "center", verticalAlignment: "center" };
guide.getRange("B5:B9").format = { fill: C.panel, font: { bold: true, color: C.navy } };
guide.getRange("C5:J9").merge(true);
guide.getRange("C5:J9").format = { wrapText: true, verticalAlignment: "center", font: { color: C.slate, size: 10 }, borders: { insideHorizontal: { style: "thin", color: C.line } } };
guide.getRange("A5:J9").format.rowHeight = 42;

sectionHeader(guide, "A11:J11", "ĐỊNH NGHĨA WORKFLOW");
guide.getRange("A12:C19").values = [
  ["Trạng thái", "Khi nào dùng", "Điều kiện chuyển tiếp"],
  ["Backlog", "Ý tưởng/chưa cam kết sprint", "Có mô tả giá trị và người yêu cầu"],
  ["Ready", "Đã đủ thông tin để bắt đầu", "Có AC, estimate, owner, dependency"],
  ["In Progress", "Đang thực hiện", "Owner đã bắt đầu; cập nhật cuối không quá ngưỡng stale"],
  ["Code Review", "Đã mở PR", "PR link/nội dung review rõ ràng; CI pass"],
  ["QA", "Đang kiểm thử", "Có môi trường và dữ liệu test"],
  ["Blocked", "Không thể tiến tiếp", "Bắt buộc có lý do, dependency và hành động gỡ"],
  ["Done", "Đạt Definition of Done", "AC đạt; test pass; deploy/tài liệu hoàn tất theo phạm vi"],
];
styleTableHeader(guide.getRange("A12:C12"));
guide.getRange("A13:C19").format = { wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };
guide.getRange("A13:C19").format.rowHeight = 44;
addStatusFormatting(guide, "A13:A19");

sectionHeader(guide, "E11:J11", "NHỊP QUẢN TRỊ KHUYẾN NGHỊ");
guide.getRange("E12:J17").values = [
  ["Thời điểm", "Người chịu trách nhiệm", "Việc phải làm", null, null, null],
  ["Sprint Planning", "PO + Tech Lead", "Chốt mục tiêu sprint, scope, owner, estimate, dependency và capacity.", null, null, null],
  ["Daily", "Mọi Owner", "Cập nhật status, blocker, actual và last updated trước daily.", null, null, null],
  ["2 lần/tuần", "PO + Lead", "Xử lý overdue, stale, P0/P1 và RAID điểm cao.", null, null, null],
  ["Sprint Review", "PO", "Đối chiếu Done SP, tỷ lệ hoàn thành, chất lượng và release.", null, null, null],
  ["Retrospective", "Cả đội", "Ghi quyết định cải tiến thành task/RAID có owner và due date.", null, null, null],
];
guide.getRange("E12:F12").format = { fill: C.navy, font: { bold: true, color: C.white }, wrapText: true };
guide.getRange("G12:J12").merge();
guide.getRange("G12:J12").values = [["Việc phải làm"]];
guide.getRange("G12:J12").format = { fill: C.navy, font: { bold: true, color: C.white }, wrapText: true };
guide.getRange("G13:J17").merge(true);
guide.getRange("E13:J17").format = { wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: C.line } }, font: { size: 9, color: C.navy } };

sectionHeader(guide, "A22:J22", "QUY TẮC VÀ GIỚI HẠN QUAN TRỌNG");
guide.getRange("A23:J27").values = [
  ["• ID không được trùng giữa hai đội. Giữ ID ổn định dù task đổi sprint hoặc owner.", null, null, null, null, null, null, null, null, null],
  ["• Không nhập trực tiếp KPI/báo cáo. Mọi con số được tính từ Backend, Frontend, RAID và Cấu hình.", null, null, null, null, null, null, null, null, null],
  ["• Google Sheets Version history là audit log. Workbook không tự lưu lịch sử từng lần đổi ô như Jira.", null, null, null, null, null, null, null, null, null],
  ["• Với tệp đính kèm/PR/spec, đặt URL vào Mô tả, Nhãn hoặc Kế hoạch; không nhúng file lớn vào workbook.", null, null, null, null, null, null, null, null, null],
  ["• Khi vượt 200 task/đội, hãy mở rộng bảng, công thức, validation và toàn bộ phạm vi báo cáo tương ứng.", null, null, null, null, null, null, null, null, null],
];
guide.getRange("A23:J27").merge(true);
guide.getRange("A23:J27").format = { fill: C.panel, wrapText: true, verticalAlignment: "center", font: { color: C.slate, size: 9 }, borders: { insideHorizontal: { style: "thin", color: C.line } } };
guide.getRange("A23:J27").format.rowHeight = 28;
guide.getRange("A:A").format.columnWidth = 7;
guide.getRange("B:B").format.columnWidth = 18;
guide.getRange("C:J").format.columnWidth = 13;
guide.getRange("C:C").format.columnWidth = 28;
guide.getRange("E:E").format.columnWidth = 18;
guide.getRange("F:F").format.columnWidth = 22;
guide.showGridLines = false;
guide.freezePanes.freezeRows(2);

// Comments on critical control cells.
wb.comments.setSelf({ displayName: "User" });
wb.comments.addThread({ cell: config.getRange("B5") }, "Chọn sprint này để đồng bộ Dashboard, Sprint và Báo cáo.");
wb.comments.addThread({ cell: config.getRange("B8") }, "Capacity là tổng Story Point đội cam kết trong sprint; dùng để theo dõi mức tải.");
wb.comments.addThread({ cell: config.getRange("B10") }, "Task mở có ngày Cập nhật cuối cũ hơn ngưỡng này sẽ bị báo stale.");

// Compact verification and previews for every sheet.
await fs.mkdir(outputDir, { recursive: true });
await fs.rm(previewDir, { recursive: true, force: true });
await fs.mkdir(previewDir, { recursive: true });

const inspectDashboard = await wb.inspect({ kind: "table", range: "Dashboard!A1:P30", include: "values,formulas", tableMaxRows: 30, tableMaxCols: 16, maxChars: 12000 });
await fs.writeFile(path.join(taskDir, "inspect_dashboard.ndjson"), inspectDashboard.ndjson ?? "", "utf8");
const inspectReport = await wb.inspect({ kind: "table", range: "Báo cáo!A1:L20", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 12, maxChars: 12000 });
await fs.writeFile(path.join(taskDir, "inspect_report.ndjson"), inspectReport.ndjson ?? "", "utf8");
const inspectSprint = await wb.inspect({ kind: "table", range: "Sprint!A3:F8", include: "values,formulas", tableMaxRows: 10, tableMaxCols: 8, maxChars: 6000 });
await fs.writeFile(path.join(taskDir, "inspect_sprint.ndjson"), inspectSprint.ndjson ?? "", "utf8");
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
await fs.writeFile(path.join(taskDir, "formula_errors.ndjson"), errors.ndjson ?? "", "utf8");

const previewSpecs = [
  ["Hướng dẫn", "A1:J27", "01_huong_dan.png", 1.15],
  ["Dashboard", "A1:P44", "02_dashboard.png", 1.1],
  ["Backend", "A1:AC14", "03_backend.png", 0.75],
  ["Frontend", "A1:AC14", "04_frontend.png", 0.75],
  ["Sprint", "A1:L25", "05_sprint.png", 1.0],
  ["Báo cáo", "A1:N33", "06_bao_cao.png", 1.0],
  ["RAID", "A1:O12", "07_raid.png", 0.9],
  ["Cấu hình", "A1:W31", "08_cau_hinh.png", 0.85],
];
for (const [sheetName, range, fileName, scale] of previewSpecs) {
  const blob = await wb.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await blob.arrayBuffer()));
}

const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(path.join(outputDir, "ERG_Notion_Task_Workspace.xlsx"));
console.log(JSON.stringify({ output: path.join(outputDir, "ERG_Notion_Task_Workspace.xlsx"), previewDir }));
