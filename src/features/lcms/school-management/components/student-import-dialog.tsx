import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState, type ChangeEvent } from "react";
import { StudentSpreadsheetGrid } from "@/features/lcms/school-management/components/student-spreadsheet-grid";
import { createBlankImportRow, validateImportRow } from "@/features/lcms/school-management/components/student-import-utils";
import type { PartnerSchool, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";

const blankRows = () => Array.from({ length: 8 }, (_, index) => createBlankImportRow(index));

export function StudentImportDialog({ onClose, onImport, school }: {
  onClose: () => void;
  onImport: (rows: StudentImportRow[]) => void;
  school: PartnerSchool;
}) {
  const [source, setSource] = useState(0);
  const [rows, setRows] = useState<StudentImportRow[]>(blankRows);
  const [sheetUrl, setSheetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = schoolTypeMeta[school.schoolType];
  const usesGrades = schoolTypeUsesGrades(school.schoolType);

  const validRows = rows.filter((row) => row.valid);

  async function readExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setMessage("");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, defval: "" });
      setRows(normalizeMatrix(data.slice(1), usesGrades));
      setMessage(`Đã đọc ${Math.max(0, data.length - 1)} dòng từ ${file.name}. Kiểm tra lại dữ liệu trước khi nhập.`);
    } catch { setMessage("Không thể đọc file. Vui lòng dùng định dạng .xlsx hoặc .xls hợp lệ."); }
    finally { setLoading(false); }
  }

  async function readGoogleSheet() {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) { setMessage("Đường dẫn Google Sheets chưa hợp lệ."); return; }
    setLoading(true); setMessage("");
    try {
      const gid = new URL(sheetUrl).searchParams.get("gid") ?? "0";
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&gid=${gid}`);
      if (!response.ok) throw new Error();
      const matrix = parseCsv(await response.text());
      setRows(normalizeMatrix(matrix.slice(1), usesGrades));
      setMessage(`Đã kết nối và đọc ${Math.max(0, matrix.length - 1)} dòng. Sheet cần bật quyền xem bằng liên kết.`);
    } catch { setMessage("Không đọc được Google Sheets. Kiểm tra quyền chia sẻ hoặc thử tải file Excel."); }
    finally { setLoading(false); }
  }

  function confirmImport() { onImport(validRows); onClose(); }

  return (
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open slotProps={{ paper: { sx: { height: { xs: "100%", md: "min(820px, 92vh)" }, m: { xs: 0, md: 2 } } } }}>
      <DialogTitle sx={{ pb: 1 }}>Nhập danh sách {meta.learnerLabel.toLowerCase()} · {school.name}<Typography color="text.secondary" variant="body2">Chọn nguồn, kiểm tra bảng dữ liệu rồi xác nhận nhập hàng loạt.</Typography></DialogTitle>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 3 }}><Tabs onChange={(_, value) => { setSource(value); setRows(blankRows()); setMessage(""); }} value={source}><Tab icon={<FileUploadRoundedIcon />} iconPosition="start" label="Từ Excel" /><Tab icon={<CloudDownloadRoundedIcon />} iconPosition="start" label="Từ Google Sheets" /><Tab icon={<GridOnRoundedIcon />} iconPosition="start" label="Nhập tay hàng loạt" /></Tabs></Box>
      {loading ? <LinearProgress /> : null}
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
        {source === 0 ? <Box sx={{ alignItems: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider", borderRadius: 2, display: "flex", gap: 2, p: 2 }}><input ref={fileRef} accept=".xlsx,.xls,.csv" hidden onChange={readExcel} type="file" /><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>Tải file danh sách {meta.learnerLabel.toLowerCase()}</Typography><Typography color="text.secondary" variant="body2">Cột mẫu: {usesGrades ? "Mã, Họ tên, Ngày sinh, Khối, Lớp, SĐT liên hệ." : "Mã, Họ tên, Ngày sinh, Lớp, SĐT liên hệ."}</Typography></Box><Button onClick={() => fileRef.current?.click()} startIcon={<FileUploadRoundedIcon />} variant="outlined">Chọn file</Button></Box> : null}
        {source === 1 ? <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}><TextField fullWidth label="Đường dẫn Google Sheets" onChange={(event) => setSheetUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." size="small" value={sheetUrl} /><Button disabled={loading} onClick={readGoogleSheet} startIcon={<CloudDownloadRoundedIcon />} sx={{ minWidth: 150 }} variant="contained">Đọc dữ liệu</Button></Box> : null}
        {source === 2 ? <Typography color="text.secondary" variant="body2">Nhập trực tiếp hoặc dán một vùng nhiều hàng/cột từ bảng tính. Hệ thống tự kiểm tra các trường bắt buộc.</Typography> : null}
        {message ? <Typography color={message.startsWith("Đã") ? "success.main" : "error.main"} variant="body2">{message}</Typography> : null}
        <StudentSpreadsheetGrid onChange={setRows} rows={rows} usesGrades={usesGrades} />
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 1.5 }}><Typography color="text.secondary" variant="body2">{validRows.length} hợp lệ · {rows.length - validRows.length} cần kiểm tra</Typography><Box sx={{ display: "flex", gap: 1 }}><Button onClick={onClose}>Hủy</Button><Button disabled={!validRows.length} onClick={confirmImport} variant="contained">Nhập {validRows.length} học sinh</Button></Box></DialogActions>
    </Dialog>
  );
}

function normalizeMatrix(matrix: Array<Array<string | number>>, usesGrades: boolean) {
  return matrix.filter((cells) => cells.some((cell) => String(cell).trim())).map((cells, index) => validateImportRow(usesGrades
    ? { id: `import-${Date.now()}-${index}`, code: String(cells[0] ?? ""), fullName: String(cells[1] ?? ""), birthDate: String(cells[2] ?? ""), grade: String(cells[3] ?? ""), className: String(cells[4] ?? ""), guardianPhone: String(cells[5] ?? ""), note: "", valid: false }
    : { id: `import-${Date.now()}-${index}`, code: String(cells[0] ?? ""), fullName: String(cells[1] ?? ""), birthDate: String(cells[2] ?? ""), grade: "", className: String(cells[3] ?? ""), guardianPhone: String(cells[4] ?? ""), note: "", valid: false }, usesGrades));
}

function parseCsv(csv: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) { const char = csv[index]; const next = csv[index + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { row.push(cell); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += char; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows;
}
