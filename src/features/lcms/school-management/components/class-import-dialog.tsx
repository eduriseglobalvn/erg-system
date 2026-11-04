import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { fetchGoogleSheetCsv, fetchGoogleSheetTabs, parseGoogleSheetUrl } from "@/features/lcms/imports/google-sheets-csv-adapter";
import { buildClassImportPreview, type ClassImportPreviewRow } from "@/features/lcms/school-management/components/class-import-utils";
import { extractClassesFromSchoolSheets, isSchoolRosterMatrix } from "@/features/lcms/school-management/utils/vietnamese-school-sheet-parser";
import type { SchoolClass, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

type ClassRow = Omit<SchoolClass, "id">;

export function ClassImportDialog({
  classLabel,
  existingClassNames,
  grades,
  onClose,
  onImport,
  usesGrades,
}: {
  classLabel: string;
  existingClassNames: string[];
  grades: string[];
  onClose: () => void;
  onImport: (classes: ClassRow[], students?: StudentImportRow[]) => void | Promise<void>;
  usesGrades: boolean;
}) {
  const [source, setSource] = useState(0);
  const [url, setUrl] = useState("");
  const [manual, setManual] = useState<ClassRow>({ grade: grades[0] ?? "", homeroomTeacher: "", name: "", studentCount: 0 });
  const [preview, setPreview] = useState<ClassImportPreviewRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [autoImportStudents, setAutoImportStudents] = useState(true);
  const [viewingClass, setViewingClass] = useState<ClassImportPreviewRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const validRows = preview.filter((row) => row.valid);
  const invalidCount = preview.length - validRows.length;
  const detectedGrades = Array.from(new Set(validRows.map((row) => row.grade).filter(Boolean)));
  const totalDetectedStudents = validRows.reduce((sum, r) => sum + (r.students?.length ?? 0), 0);

  function makePreview(matrix: Array<Array<string | number>>, name: string) {
    const rows = buildClassImportPreview(matrix, { existingClassNames, grades, usesGrades });
    setPreview(rows);
    setSourceName(name);
    // Select all valid rows by default
    const validIdxs = new Set(
      rows
        .map((r, idx) => (r.valid ? idx : -1))
        .filter((idx) => idx >= 0)
    );
    setSelectedIndices(validIdxs);
    if (!rows.length) {
      setMessage("Không tìm thấy dòng dữ liệu lớp hợp lệ trong nguồn này.");
    } else if (isSchoolRosterMatrix(matrix)) {
      setMessage(`Đã phát hiện sổ điểm danh/học sinh và tự động trích xuất ${rows.length} lớp từ dữ liệu.`);
    } else {
      setMessage(`Đã đọc ${rows.length} lớp từ ${name}. Kiểm tra preview trước khi xác nhận.`);
    }
  }

  async function readExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setMessage(""); setPreview([]); setSelectedIndices(new Set());
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetNames = workbook.SheetNames;
      if (sheetNames.length > 1) {
        const sheets = sheetNames.map((name) => ({
          name,
          matrix: XLSX.utils.sheet_to_json<Array<string | number>>(workbook.Sheets[name], { header: 1, defval: "" }),
        }));
        if (sheets.some((s) => isSchoolRosterMatrix(s.matrix))) {
          const previewRows = extractClassesFromSchoolSheets(sheets, {
            existingClassNames,
            grades,
            usesGrades,
          });
          setPreview(previewRows);
          const validIdxs = new Set(
            previewRows
              .map((r, idx) => (r.valid ? idx : -1))
              .filter((idx) => idx >= 0)
          );
          setSelectedIndices(validIdxs);
          setSourceName(file.name);
          setMessage(`Đã phát hiện sổ điểm danh và tự động trích xuất ${previewRows.length} lớp từ ${sheetNames.length} sheet.`);
          return;
        }
      }
      const sheet = workbook.Sheets[sheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, defval: "" });
      makePreview(matrix, file.name);
    } catch { setMessage("Không đọc được file lớp. Vui lòng kiểm tra định dạng .xlsx, .xls hoặc .csv."); }
    finally { setLoading(false); }
  }

  async function readSheet() {
    setLoading(true); setMessage(""); setPreview([]); setSelectedIndices(new Set());
    try {
      const parsed = parseGoogleSheetUrl(url);
      const tabs = await fetchGoogleSheetTabs(parsed.spreadsheetId).catch(() => []);
      if (tabs.length > 1) {
        const sheets = await Promise.all(
          tabs.slice(0, 30).map(async (tab) => ({
            name: tab.name,
            matrix: await fetchGoogleSheetCsv(url, { sheetName: tab.name }).catch(() => []),
          }))
        );
        const validSheets = sheets.filter((s) => s.matrix.length > 0);
        if (validSheets.some((s) => isSchoolRosterMatrix(s.matrix))) {
          const previewRows = extractClassesFromSchoolSheets(validSheets, {
            existingClassNames,
            grades,
            usesGrades,
          });
          setPreview(previewRows);
          const validIdxs = new Set(
            previewRows
              .map((r, idx) => (r.valid ? idx : -1))
              .filter((idx) => idx >= 0)
          );
          if (validIdxs.size === 0 && previewRows.length > 0) {
            previewRows.forEach((r, idx) => {
              if (r.students && r.students.length > 0) validIdxs.add(idx);
            });
            setMessage(`Đã nhận diện ${previewRows.length} lớp (tất cả đã có sẵn trong trường). Hệ thống đã chọn sẵn tất cả để bạn nạp danh sách ${previewRows.reduce((acc, r) => acc + (r.students?.length || 0), 0)} học sinh vào các lớp tương ứng.`);
          } else {
            setMessage(`Đã phát hiện sổ điểm danh và tự động trích xuất ${previewRows.length} lớp từ ${validSheets.length} tab lớp (${tabs.map((t) => t.name).slice(0, 4).join(", ")}...). Các lớp đã có sẵn có thể được tick chọn để nạp thêm học sinh.`);
          }
          setSelectedIndices(validIdxs);
          setSourceName("Google Sheets");
          return;
        }
      }

      const matrix = await fetchGoogleSheetCsv(url);
      makePreview(matrix, "Google Sheets");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không đọc được Google Sheets. Kiểm tra quyền chia sẻ bằng liên kết."); }
    finally { setLoading(false); }
  }

  function handleToggleRow(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSelectAllValid() {
    const next = new Set<number>();
    preview.forEach((row, idx) => {
      if (row.valid || row.issues.every((i) => i === "Lớp đã tồn tại trong trường")) next.add(idx);
    });
    setSelectedIndices(next);
  }

  function handleSelectAllToImportStudents() {
    const next = new Set<number>();
    preview.forEach((row, idx) => {
      if ((row.students && row.students.length > 0) || row.valid) next.add(idx);
    });
    setSelectedIndices(next);
  }

  function handleDeselectAll() {
    setSelectedIndices(new Set());
  }

  function handleUpdateClassStudents(classRowName: string, updatedStudents: StudentImportRow[]) {
    setPreview((prev) =>
      prev.map((r) =>
        r.name === classRowName
          ? { ...r, students: updatedStudents, studentCount: updatedStudents.length }
          : r
      )
    );
    setViewingClass(null);
  }

  function handleToggleAll() {
    if (selectedIndices.size === preview.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(preview.map((_, idx) => idx)));
    }
  }

  // Selected valid rows (classes to create in backend)
  const selectedRows = preview.filter((_, idx) => selectedIndices.has(idx));
  const selectedValidClasses = source === 0
    ? [manual]
    : selectedRows.filter((r) => r.valid).map(({ grade, homeroomTeacher, name, studentCount }) => ({ grade, homeroomTeacher, name, studentCount }));

  // Students to import (can include students of existing classes if the user keeps that class selected!)
  const selectedStudents = (autoImportStudents && totalDetectedStudents > 0)
    ? selectedRows
        .filter((r) => r.valid || r.issues.every((i) => i === "Lớp đã tồn tại trong trường"))
        .flatMap((r) => r.students ?? [])
    : [];

  const manualValid = Boolean(manual.name.trim() && (!usesGrades || manual.grade.trim()));
  const canConfirm = source === 0
    ? manualValid
    : (selectedValidClasses.length > 0 || (autoImportStudents && selectedStudents.length > 0));
  // confirmCount derived directly from selectedValidClasses.length

  async function confirm() {
    setImporting(true);
    setMessage("");
    try {
      await Promise.resolve(onImport(selectedValidClasses, selectedStudents));
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Dialog fullWidth maxWidth="lg" onClose={importing ? undefined : onClose} open slotProps={{ paper: { sx: { maxHeight: "90dvh" } } }}>
        <DialogTitle>Tạo {classLabel.toLowerCase()}<Typography color="text.secondary" variant="body2">Dữ liệu chỉ được ghi vào trường sau khi bạn xem preview và xác nhận.</Typography></DialogTitle>
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 3 }}><Tabs onChange={(_, value) => { setSource(value); setMessage(""); setPreview([]); }} value={source} variant="scrollable"><Tab icon={<AddRoundedIcon />} iconPosition="start" label="Tạo tay" /><Tab icon={<FileUploadRoundedIcon />} iconPosition="start" label="Từ Excel" /><Tab icon={<CloudDownloadRoundedIcon />} iconPosition="start" label="Google Sheets" /></Tabs></Box>
        {loading || importing ? <LinearProgress /> : null}
        <DialogContent sx={{ display: "grid", gap: 2, minHeight: 260, overflow: "auto", pt: 3 }}>
          {source === 0 ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><TextField label={`Tên ${classLabel.toLowerCase()}`} required value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} />{usesGrades ? <TextField label="Khối" required select value={manual.grade} onChange={(event) => setManual({ ...manual, grade: event.target.value })}>{grades.map((grade) => <MenuItem key={grade} value={grade}>Khối {grade}</MenuItem>)}</TextField> : null}<TextField label="Giáo viên phụ trách" value={manual.homeroomTeacher} onChange={(event) => setManual({ ...manual, homeroomTeacher: event.target.value })} /><TextField label="Sĩ số dự kiến" type="number" value={manual.studentCount} onChange={(event) => setManual({ ...manual, studentCount: Number(event.target.value) || 0 })} /></Box> : null}
          {source === 1 ? <Paper sx={{ bgcolor: "background.default", borderStyle: "dashed", p: 3, textAlign: "center" }} variant="outlined"><input ref={fileRef} accept=".xlsx,.xls,.csv" hidden onChange={readExcel} type="file" /><FileUploadRoundedIcon color="primary" /><Typography sx={{ fontWeight: 600, mt: 1 }}>File gồm: {usesGrades ? "Tên lớp, Khối, Giáo viên phụ trách, Sĩ số" : "Tên lớp, Giáo viên phụ trách, Sĩ số"}</Typography><Typography color="text.secondary" variant="body2">Hệ thống tự nhận diện cột, hoặc tự động trích xuất các lớp từ sổ điểm danh nhiều sheet.</Typography><Button disabled={loading} onClick={() => fileRef.current?.click()} sx={{ mt: 2 }} variant="outlined">Chọn file lớp</Button></Paper> : null}
          {source === 2 ? <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}><TextField fullWidth label="Đường dẫn Google Sheets" value={url} onChange={(event) => setUrl(event.target.value)} /><Button disabled={loading || !url.trim()} onClick={readSheet} sx={{ minWidth: 150 }} variant="contained">Đọc dữ liệu</Button></Box> : null}
          {loading ? <PreviewSkeleton /> : null}
          {!loading && message ? (
            <Alert severity={message.toLowerCase().includes("lỗi") || message.toLowerCase().includes("không thể") ? "error" : invalidCount ? "warning" : "success"}>
              {message}
            </Alert>
          ) : null}
          {!loading && source !== 0 && totalDetectedStudents > 0 ? (
            <Paper
              sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                bgcolor: "primary.50",
                border: "1px solid",
                borderColor: "primary.200",
                borderRadius: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
                justifyContent: "space-between",
                p: 1.5,
              }}
              variant="outlined"
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoImportStudents}
                    color="primary"
                    onChange={(event) => setAutoImportStudents(event.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ color: "primary.900", fontSize: 13, fontWeight: 600 }}>
                      Đồng thời nạp luôn danh sách {selectedStudents.length} học sinh vào các lớp đã chọn
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      Hệ thống tự động liên kết học sinh vào đúng từng lớp, bạn không cần phải tải lên lại ở Bước 3.
                    </Typography>
                  </Box>
                }
              />
              <Chip
                color="primary"
                icon={<CheckCircleRoundedIcon />}
                label={`${selectedStudents.length} học sinh đã chọn`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Paper>
          ) : null}
          {!loading && source !== 0 && preview.length ? (
            <PreviewTable
              detectedGrades={detectedGrades}
              invalidCount={invalidCount}
              onDeselectAll={handleDeselectAll}
              onSelectAllToImportStudents={handleSelectAllToImportStudents}
              onSelectAllValid={handleSelectAllValid}
              onToggleAll={handleToggleAll}
              onToggleRow={handleToggleRow}
              onViewStudents={(row) => setViewingClass(row)}
              rows={preview}
              selectedIndices={selectedIndices}
              sourceName={sourceName}
              usesGrades={usesGrades}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 2 }}>
          <Typography color={canConfirm ? "text.primary" : "text.secondary"} variant="body2" sx={{ fontWeight: 600 }}>
            {source === 0
              ? "Tạo một lớp thủ công"
              : canConfirm
              ? selectedValidClasses.length > 0
                ? `Đã chọn ${selectedValidClasses.length} lớp mới & ${selectedStudents.length} học sinh${invalidCount > 0 ? ` (Bỏ qua ${preview.length - selectedRows.length} lớp không chọn)` : ""}`
                : `Đã chọn nạp ${selectedStudents.length} học sinh vào ${selectedRows.length} lớp đã có trong trường`
              : "Vui lòng chọn ít nhất 1 lớp hoặc học sinh để thực hiện"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" disabled={importing} onClick={onClose}>Hủy</Button>
            <Button
              disabled={!canConfirm || importing}
              onClick={confirm}
              startIcon={importing ? <CircularProgress color="inherit" size={16} /> : <CheckCircleRoundedIcon />}
              variant="contained"
            >
              {importing
                ? "Đang lưu..."
                : selectedValidClasses.length > 0 && selectedStudents.length > 0
                ? `Xác nhận tạo ${selectedValidClasses.length} lớp & nạp ${selectedStudents.length} học sinh`
                : selectedValidClasses.length > 0
                ? `Xác nhận tạo ${selectedValidClasses.length} lớp`
                : selectedStudents.length > 0
                ? `Xác nhận nạp ${selectedStudents.length} học sinh vào ${selectedRows.length} lớp`
                : "Xác nhận lưu"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      {viewingClass ? (
        <ClassStudentsViewerDialog
          classRow={viewingClass}
          onClose={() => setViewingClass(null)}
          onSaveSelection={(updated) => handleUpdateClassStudents(viewingClass.name, updated)}
        />
      ) : null}
    </>
  );
}

function PreviewTable({
  detectedGrades,
  invalidCount,
  onDeselectAll,
  onSelectAllToImportStudents,
  onSelectAllValid,
  onToggleAll,
  onToggleRow,
  onViewStudents,
  rows,
  selectedIndices,
  sourceName,
  usesGrades,
}: {
  detectedGrades: string[];
  invalidCount: number;
  onDeselectAll: () => void;
  onSelectAllToImportStudents?: () => void;
  onSelectAllValid: () => void;
  onToggleAll: () => void;
  onToggleRow: (index: number) => void;
  onViewStudents: (row: ClassImportPreviewRow) => void;
  rows: ClassImportPreviewRow[];
  selectedIndices: Set<number>;
  sourceName: string;
  usesGrades: boolean;
}) {
  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0 && !allSelected;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Chip color="primary" label={`${rows.length} lớp`} size="small" />
        {usesGrades ? <Chip label={`${detectedGrades.length} khối: ${detectedGrades.join(", ") || "—"}`} size="small" variant="outlined" /> : null}
        <Chip color="primary" label={`Đã chọn ${selectedIndices.size}/${rows.length} lớp`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        {invalidCount ? <Chip color="warning" label={`${invalidCount} lớp trùng/lỗi`} size="small" /> : <Chip color="success" label="Tất cả hợp lệ" size="small" />}
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, ml: "auto" }}>
          {onSelectAllToImportStudents ? (
            <Button color="primary" onClick={onSelectAllToImportStudents} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="outlined">
              Chọn tất cả để nạp HS
            </Button>
          ) : null}
          <Button onClick={onSelectAllValid} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
            Chỉ tạo lớp mới
          </Button>
          <Button color="inherit" onClick={onDeselectAll} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
            Bỏ chọn
          </Button>
          {sourceName ? (
            <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "inline" }, pl: 1 }} variant="caption">
              Nguồn: {sourceName}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: 360 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                  size="small"
                />
              </TableCell>
              <TableCell>Dòng</TableCell>
              <TableCell>Tên lớp</TableCell>
              {usesGrades ? <TableCell>Khối</TableCell> : null}
              <TableCell>Giáo viên phụ trách</TableCell>
              <TableCell align="right">Sĩ số & Danh sách</TableCell>
              <TableCell>Kiểm tra</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isSelected = selectedIndices.has(index);
              const isExisting = row.issues.includes("Lớp đã tồn tại trong trường");

              return (
                <TableRow
                  hover
                  key={`${row.sourceRow}-${row.name}`}
                  selected={isSelected}
                  sx={{
                    bgcolor: isSelected ? "action.hover" : undefined,
                    opacity: isSelected ? 1 : 0.65,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleRow(index)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.sourceRow}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name || "—"}</TableCell>
                  {usesGrades ? <TableCell>{row.grade || "—"}</TableCell> : null}
                  <TableCell>{row.homeroomTeacher || "Chưa gán"}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Typography sx={{ fontWeight: 600 }}>{row.studentCount}</Typography>
                      {row.students && row.students.length > 0 ? (
                        <Button
                          onClick={() => onViewStudents(row)}
                          size="small"
                          startIcon={<PeopleAltRoundedIcon fontSize="small" />}
                          sx={{ fontSize: 11, fontWeight: 600, minHeight: 24, px: 1, py: 0.25, textTransform: "none" }}
                          variant="outlined"
                        >
                          Xem {row.students.length} HS
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {row.valid ? (
                      <Chip color="success" icon={<CheckCircleRoundedIcon />} label="Hợp lệ" size="small" />
                    ) : isExisting ? (
                      <Chip
                        color="warning"
                        icon={<ErrorOutlineRoundedIcon />}
                        label={isSelected ? "Lớp đã tồn tại (chỉ nạp thêm HS)" : "Lớp đã tồn tại trong trường"}
                        size="small"
                      />
                    ) : (
                      <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                        <ErrorOutlineRoundedIcon color="warning" fontSize="small" />
                        <Typography color="warning.main" variant="caption">{row.issues.join(" · ")}</Typography>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function ClassStudentsViewerDialog({
  classRow,
  onClose,
  onSaveSelection,
}: {
  classRow: ClassImportPreviewRow;
  onClose: () => void;
  onSaveSelection: (updatedStudents: StudentImportRow[]) => void;
}) {
  const [filterText, setFilterText] = useState("");
  const allStudents: StudentImportRow[] = useMemo(() => classRow.students ?? [], [classRow.students]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(allStudents.map((s, idx) => s.id || `s-${idx}`))
  );

  const filteredStudents = useMemo(() => (
    allStudents.filter((s) =>
      `${s.fullName} ${s.code || ""} ${s.className || ""}`.toLowerCase().includes(filterText.toLowerCase().trim())
    )
  ), [allStudents, filterText]);

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s, idx) => selectedIds.has(s.id || `s-${idx}`));
  const someFilteredSelected = filteredStudents.some((s, idx) => selectedIds.has(s.id || `s-${idx}`)) && !allFilteredSelected;

  function handleToggleAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredStudents.forEach((s, idx) => next.delete(s.id || `s-${idx}`));
      } else {
        filteredStudents.forEach((s, idx) => next.add(s.id || `s-${idx}`));
      }
      return next;
    });
  }

  function handleToggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(allStudents.map((s, idx) => s.id || `s-${idx}`)));
  }

  function handleDeselectAll() {
    setSelectedIds(new Set());
  }

  function handleSelectOnlyValid() {
    const next = new Set<string>();
    allStudents.forEach((s, idx) => {
      if (s.valid) next.add(s.id || `s-${idx}`);
    });
    setSelectedIds(next);
  }

  function handleSave() {
    const updated = allStudents.filter((s, idx) => selectedIds.has(s.id || `s-${idx}`));
    onSaveSelection(updated);
  }

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open slotProps={{ paper: { sx: { maxHeight: "90dvh" } } }}>
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 19, fontWeight: 600 }}>
              Danh sách học sinh lớp {classRow.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Khối {classRow.grade || "—"} · Giáo viên phụ trách: {classRow.homeroomTeacher || "Chưa gán"} · Tổng {allStudents.length} học sinh trong sheet
            </Typography>
          </Box>
          <Chip
            color="primary"
            label={`Đã chọn ${selectedIds.size} / ${allStudents.length} HS`}
            size="medium"
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 380, pt: 2.5 }}>
        <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <TextField
            label="Tìm học sinh theo tên, mã hoặc lớp..."
            onChange={(e) => setFilterText(e.target.value)}
            size="small"
            sx={{ minWidth: { sm: 320 } }}
            value={filterText}
          />
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button onClick={handleSelectAll} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="text">
              Chọn tất cả ({allStudents.length})
            </Button>
            <Button color="inherit" onClick={handleDeselectAll} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
              Bỏ chọn
            </Button>
            <Button color="success" onClick={handleSelectOnlyValid} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="outlined">
              Chỉ chọn hợp lệ
            </Button>
          </Box>
        </Box>
        <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: { xs: 400, md: "min(560px, 60vh)" } }}>
          <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={handleToggleAllFiltered}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: 60 }}>STT</TableCell>
                <TableCell>Họ và tên</TableCell>
                <TableCell>Khối</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Mã học sinh</TableCell>
                <TableCell>Điện thoại / Liên hệ</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, idx) => {
                const sId = student.id || `s-${idx}`;
                const isSelected = selectedIds.has(sId);
                return (
                  <TableRow
                    hover
                    key={sId}
                    selected={isSelected}
                    sx={{
                      bgcolor: isSelected ? "action.hover" : undefined,
                      opacity: isSelected ? 1 : 0.65,
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleStudent(sId)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 600 }}>{student.fullName}</TableCell>
                    <TableCell>{student.grade || classRow.grade || "—"}</TableCell>
                    <TableCell>{student.className || classRow.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {student.code || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                      {student.guardianPhone || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={student.valid ? "success" : "warning"}
                        icon={student.valid ? <CheckCircleRoundedIcon fontSize="small" /> : undefined}
                        label={student.valid ? "Hợp lệ" : student.note}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filteredStudents.length ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>
                    {filterText ? "Không tìm thấy học sinh nào phù hợp từ khóa tìm kiếm." : "Không có học sinh nào trong lớp này."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 2 }}>
        <Typography color="text.secondary" variant="body2">
          Đang chọn {selectedIds.size} / {allStudents.length} học sinh để nạp vào lớp {classRow.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            Đóng
          </Button>
          <Button
            onClick={handleSave}
            startIcon={<CheckCircleRoundedIcon />}
            variant="contained"
          >
            Lưu danh sách đã chọn ({selectedIds.size} HS)
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function PreviewSkeleton() {
  return <Box sx={{ display: "grid", gap: 1 }}><Box sx={{ display: "flex", gap: 1 }}><Skeleton height={28} variant="rounded" width={90} /><Skeleton height={28} variant="rounded" width={130} /><Skeleton height={28} variant="rounded" width={110} /></Box><Skeleton height={44} variant="rounded" />{Array.from({ length: 5 }, (_, index) => <Skeleton height={38} key={index} variant="rounded" />)}</Box>;
}
