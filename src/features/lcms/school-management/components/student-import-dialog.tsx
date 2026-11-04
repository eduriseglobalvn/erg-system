import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
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
import { fetchGoogleSheetCsv, fetchGoogleSheetTabs, parseGoogleSheetUrl, type GoogleSheetTab } from "@/features/lcms/imports/google-sheets-csv-adapter";
import { StudentSpreadsheetGrid } from "@/features/lcms/school-management/components/student-spreadsheet-grid";
import { createBlankImportRow, validateImportRow } from "@/features/lcms/school-management/components/student-import-utils";
import { extractStudentsFromRosterMatrix, isSchoolRosterMatrix } from "@/features/lcms/school-management/utils/vietnamese-school-sheet-parser";
import type { PartnerSchool, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";

const blankRows = () => Array.from({ length: 8 }, (_, index) => createBlankImportRow(index));

export function StudentImportDialog({ onClose, onImport, school }: {
  onClose: () => void;
  onImport: (rows: StudentImportRow[]) => void | Promise<void>;
  school: PartnerSchool;
}) {
  const [source, setSource] = useState(0);
  const [rows, setRows] = useState<StudentImportRow[]>(blankRows);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetTabs, setSheetTabs] = useState<GoogleSheetTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = schoolTypeMeta[school.schoolType];
  const usesGrades = schoolTypeUsesGrades(school.schoolType);

  const validRows = rows.filter((row) => row.valid);

  async function readExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setMessage(""); setSheetTabs([]); setSelectedTab("all");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length > 1) {
        const tabs = sheetNames.map((name) => ({ name }));
        setSheetTabs(tabs);
        const sheets = sheetNames.map((name) => ({
          name,
          matrix: XLSX.utils.sheet_to_json<Array<string | number>>(workbook.Sheets[name], { header: 1, defval: "" }),
        }));

        const extracted = sheets.flatMap((s) =>
          isSchoolRosterMatrix(s.matrix)
            ? extractStudentsFromRosterMatrix(s.matrix, { defaultClassName: s.name, usesGrades })
            : normalizeMatrix(s.matrix, usesGrades, s.name)
        );

        setRows(extracted.length ? extracted : blankRows());
        setMessage(`Đã đọc ${extracted.length} học sinh từ ${sheetNames.length} sheet trong ${file.name}.`);
        return;
      }

      const sheet = workbook.Sheets[sheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, defval: "" });
      const extracted = isSchoolRosterMatrix(data)
        ? extractStudentsFromRosterMatrix(data, { defaultClassName: sheetNames[0], usesGrades })
        : normalizeMatrix(data.slice(1), usesGrades);

      setRows(extracted.length ? extracted : blankRows());
      setMessage(`Đã đọc ${extracted.length} học sinh từ ${file.name}. Kiểm tra lại dữ liệu trước khi nhập.`);
    } catch { setMessage("Không thể đọc file. Vui lòng dùng định dạng .xlsx hoặc .xls hợp lệ."); }
    finally { setLoading(false); }
  }

  async function loadGoogleSheetData(url: string, tabName: string) {
    setLoading(true); setMessage("");
    try {
      const parsed = parseGoogleSheetUrl(url);
      const tabs = await fetchGoogleSheetTabs(parsed.spreadsheetId).catch(() => []);
      if (tabs.length > 0) setSheetTabs(tabs);

      if (tabs.length > 1 && tabName === "all") {
        const tabResults = await Promise.all(
          tabs.slice(0, 30).map(async (tab) => ({
            name: tab.name,
            matrix: await fetchGoogleSheetCsv(url, { sheetName: tab.name }).catch(() => []),
          }))
        );

        const extracted = tabResults.flatMap((t) =>
          isSchoolRosterMatrix(t.matrix)
            ? extractStudentsFromRosterMatrix(t.matrix, { defaultClassName: t.name, usesGrades })
            : normalizeMatrix(t.matrix, usesGrades, t.name)
        );

        setRows(extracted.length ? extracted : blankRows());
        setMessage(`Đã tự động đọc ${extracted.length} học sinh từ ${tabs.length} lớp (${tabs.map((t) => t.name).slice(0, 4).join(", ")}...).`);
        return;
      }

      const targetTab = tabName !== "all" ? tabName : (tabs[0]?.name || undefined);
      const matrix = await fetchGoogleSheetCsv(url, targetTab ? { sheetName: targetTab } : {});
      const extracted = isSchoolRosterMatrix(matrix)
        ? extractStudentsFromRosterMatrix(matrix, { defaultClassName: targetTab, usesGrades })
        : normalizeMatrix(matrix.slice(1), usesGrades, targetTab);

      setRows(extracted.length ? extracted : blankRows());
      setMessage(`Đã kết nối và đọc ${extracted.length} học sinh${targetTab ? ` lớp ${targetTab}` : ""}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không đọc được Google Sheets. Kiểm tra quyền chia sẻ bằng liên kết."); }
    finally { setLoading(false); }
  }

  function handleSelectTab(tabName: string) {
    setSelectedTab(tabName);
    if (sheetUrl.trim()) {
      void loadGoogleSheetData(sheetUrl, tabName);
    }
  }

  async function confirmImport() {
    setImporting(true);
    try { await onImport(validRows); onClose(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không thể ghi dữ liệu người học."); }
    finally { setImporting(false); }
  }

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      onClose={importing ? undefined : onClose}
      open
      slotProps={{
        paper: {
          sx: {
            height: { xs: "100%", md: "min(840px, 92vh)" },
            maxHeight: "92vh",
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2.5 },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontSize: 19, fontWeight: 600 }}>
          Nhập danh sách {meta.learnerLabel.toLowerCase()} · {school.name}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.25 }}>
          Chọn nguồn, kiểm tra bảng dữ liệu rồi xác nhận nhập hàng loạt.
        </Typography>
      </DialogTitle>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 3 }}>
        <Tabs
          onChange={(_, value) => {
            setSource(value);
            setRows(blankRows());
            setMessage("");
            setSheetTabs([]);
            setSelectedTab("all");
          }}
          value={source}
        >
          <Tab icon={<FileUploadRoundedIcon />} iconPosition="start" label="Từ Excel" />
          <Tab icon={<CloudDownloadRoundedIcon />} iconPosition="start" label="Từ Google Sheets" />
          <Tab icon={<GridOnRoundedIcon />} iconPosition="start" label="Nhập tay hàng loạt" />
        </Tabs>
      </Box>
      {loading || importing ? <LinearProgress /> : null}
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, p: 3, pt: 2.5, overflow: "auto" }}>
        {source === 0 ? (
          <Box sx={{ alignItems: "center", bgcolor: "background.default", border: "1px dashed", borderColor: "divider", borderRadius: 2, display: "flex", gap: 2, p: 2 }}>
            <input ref={fileRef} accept=".xlsx,.xls,.csv" hidden onChange={readExcel} type="file" />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>Tải file danh sách {meta.learnerLabel.toLowerCase()}</Typography>
              <Typography color="text.secondary" variant="body2">Hỗ trợ file Excel thông thường hoặc sổ điểm danh có nhiều sheet theo lớp (9A1, 9A2...).</Typography>
            </Box>
            <Button onClick={() => fileRef.current?.click()} startIcon={<FileUploadRoundedIcon />} variant="outlined">
              Chọn file
            </Button>
          </Box>
        ) : null}

        {source === 1 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
              <TextField
                fullWidth
                label="Đường dẫn Google Sheets"
                onChange={(event) => setSheetUrl(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                size="small"
                value={sheetUrl}
              />
              <Button
                disabled={loading || !sheetUrl.trim()}
                onClick={() => void loadGoogleSheetData(sheetUrl, selectedTab)}
                startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <CloudDownloadRoundedIcon />}
                sx={{ minWidth: 150, height: 40 }}
                variant="contained"
              >
                {loading ? "Đang đọc..." : "Đọc dữ liệu"}
              </Button>
            </Box>
            {sheetTabs.length > 1 ? (
              <Box sx={{ alignItems: "center", bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 1.5, display: "flex", flexWrap: "wrap", gap: 1, p: 1.5 }}>
                <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600, mr: 0.5 }}>
                  Chọn lớp:
                </Typography>
                <Chip
                  clickable
                  color={selectedTab === "all" ? "primary" : "default"}
                  label={`Tất cả các lớp (${sheetTabs.length})`}
                  onClick={() => handleSelectTab("all")}
                  size="small"
                  sx={{ fontWeight: selectedTab === "all" ? 800 : 500 }}
                  variant={selectedTab === "all" ? "filled" : "outlined"}
                />
                {sheetTabs.map((tab) => (
                  <Chip
                    clickable
                    color={selectedTab === tab.name ? "primary" : "default"}
                    key={tab.name}
                    label={tab.name}
                    onClick={() => handleSelectTab(tab.name)}
                    size="small"
                    sx={{ fontWeight: selectedTab === tab.name ? 800 : 500 }}
                    variant={selectedTab === tab.name ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {source === 2 ? (
          <Typography color="text.secondary" variant="body2">
            Nhập trực tiếp hoặc dán một vùng nhiều hàng/cột từ bảng tính. Hệ thống tự kiểm tra các trường bắt buộc.
          </Typography>
        ) : null}

        {message ? (
          <Alert severity={message.startsWith("Đã") ? "success" : "error"} sx={{ py: 0.5 }}>
            {message}
          </Alert>
        ) : null}

        <StudentSpreadsheetGrid onChange={setRows} rows={rows} usesGrades={usesGrades} />
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 1.5 }}>
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
          {validRows.length} hợp lệ · {rows.length - validRows.length} cần kiểm tra
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button disabled={importing} onClick={onClose} variant="outlined">
            Hủy
          </Button>
          <Button
            disabled={!validRows.length || importing}
            onClick={() => void confirmImport()}
            startIcon={importing ? <CircularProgress color="inherit" size={16} /> : undefined}
            variant="contained"
          >
            {importing ? "Đang nhập..." : `Nhập ${validRows.length} học sinh`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function normalizeMatrix(matrix: Array<Array<string | number>>, usesGrades: boolean, defaultClassName = ""): StudentImportRow[] {
  return matrix.filter((cells) => cells.some((cell) => String(cell).trim())).map((cells, index) => {
    const rawCode = String(cells[0] ?? "");
    const rawName = String(cells[1] ?? "");
    const rawBirthDate = String(cells[2] ?? "");
    const rawGrade = usesGrades ? String(cells[3] ?? "") : "";
    const rawClass = usesGrades ? String(cells[4] ?? "") : String(cells[3] ?? "");
    const rawPhone = usesGrades ? String(cells[5] ?? "") : String(cells[4] ?? "");

    return validateImportRow({
      id: `import-${Date.now()}-${index}`,
      code: rawCode,
      fullName: rawName,
      birthDate: rawBirthDate,
      grade: rawGrade,
      className: rawClass || defaultClassName,
      guardianPhone: rawPhone,
      note: "",
      valid: false,
    }, usesGrades);
  });
}
