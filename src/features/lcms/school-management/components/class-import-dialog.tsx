import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
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
import { useRef, useState, type ChangeEvent } from "react";
import { buildClassImportPreview, parseClassImportCsv, type ClassImportPreviewRow } from "@/features/lcms/school-management/components/class-import-utils";
import type { SchoolClass } from "@/features/lcms/school-management/types/school-management-types";

type ClassRow = Omit<SchoolClass, "id">;

export function ClassImportDialog({ classLabel = "Lớp học", existingClassNames = [], grades, onClose, onImport, usesGrades = true }: {
  classLabel?: string;
  existingClassNames?: string[];
  grades: string[];
  onClose: () => void;
  onImport: (rows: ClassRow[]) => void | Promise<void>;
  usesGrades?: boolean;
}) {
  const [source, setSource] = useState(0);
  const [preview, setPreview] = useState<ClassImportPreviewRow[]>([]);
  const [manual, setManual] = useState<ClassRow>({ name: "", grade: grades[0] ?? "", homeroomTeacher: "", studentCount: 0 });
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const validRows = preview.filter((row) => row.valid);
  const invalidCount = preview.length - validRows.length;
  const detectedGrades = Array.from(new Set(validRows.map((row) => row.grade).filter(Boolean)));

  function makePreview(matrix: Array<Array<string | number>>, name: string) {
    const rows = buildClassImportPreview(matrix, { existingClassNames, grades, usesGrades });
    setPreview(rows);
    setSourceName(name);
    setMessage(rows.length ? `Đã đọc ${rows.length} lớp. Kiểm tra preview trước khi xác nhận.` : "Không tìm thấy dòng dữ liệu lớp hợp lệ trong nguồn này.");
  }

  async function readExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setMessage(""); setPreview([]);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, { header: 1, defval: "" });
      makePreview(matrix, file.name);
    } catch { setMessage("Không đọc được file lớp. Vui lòng kiểm tra định dạng .xlsx, .xls hoặc .csv."); }
    finally { setLoading(false); }
  }

  async function readSheet() {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) { setMessage("Đường dẫn Google Sheets chưa hợp lệ."); return; }
    setLoading(true); setMessage(""); setPreview([]);
    try {
      const gid = new URL(url).searchParams.get("gid") ?? "0";
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&gid=${gid}`);
      if (!response.ok) throw new Error();
      makePreview(parseClassImportCsv(await response.text()), "Google Sheets");
    } catch { setMessage("Không đọc được Google Sheets. Kiểm tra quyền chia sẻ bằng liên kết."); }
    finally { setLoading(false); }
  }

  async function confirm() {
    const payload = source === 0 ? [manual] : validRows.map(({ grade, homeroomTeacher, name, studentCount }) => ({ grade, homeroomTeacher, name, studentCount }));
    setImporting(true);
    try { await Promise.resolve(onImport(payload)); onClose(); }
    finally { setImporting(false); }
  }

  const manualValid = Boolean(manual.name.trim() && (!usesGrades || manual.grade.trim()));
  const canConfirm = source === 0 ? manualValid : preview.length > 0 && invalidCount === 0;
  const confirmCount = source === 0 ? (manualValid ? 1 : 0) : validRows.length;

  return <Dialog fullWidth maxWidth="lg" onClose={importing ? undefined : onClose} open slotProps={{ paper: { sx: { maxHeight: "90dvh" } } }}>
    <DialogTitle>Tạo {classLabel.toLowerCase()}<Typography color="text.secondary" variant="body2">Dữ liệu chỉ được ghi vào trường sau khi bạn xem preview và xác nhận.</Typography></DialogTitle>
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 3 }}><Tabs onChange={(_, value) => { setSource(value); setMessage(""); setPreview([]); }} value={source} variant="scrollable"><Tab icon={<AddRoundedIcon />} iconPosition="start" label="Tạo tay" /><Tab icon={<FileUploadRoundedIcon />} iconPosition="start" label="Từ Excel" /><Tab icon={<CloudDownloadRoundedIcon />} iconPosition="start" label="Google Sheets" /></Tabs></Box>
    {loading || importing ? <LinearProgress /> : null}
    <DialogContent sx={{ display: "grid", gap: 2, minHeight: 260, overflow: "auto", pt: 3 }}>
      {source === 0 ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><TextField label={`Tên ${classLabel.toLowerCase()}`} required value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} />{usesGrades ? <TextField label="Khối" required select value={manual.grade} onChange={(event) => setManual({ ...manual, grade: event.target.value })}>{grades.map((grade) => <MenuItem key={grade} value={grade}>Khối {grade}</MenuItem>)}</TextField> : null}<TextField label="Giáo viên phụ trách" value={manual.homeroomTeacher} onChange={(event) => setManual({ ...manual, homeroomTeacher: event.target.value })} /><TextField label="Sĩ số dự kiến" type="number" value={manual.studentCount} onChange={(event) => setManual({ ...manual, studentCount: Number(event.target.value) || 0 })} /></Box> : null}
      {source === 1 ? <Paper sx={{ bgcolor: "background.default", borderStyle: "dashed", p: 3, textAlign: "center" }} variant="outlined"><input ref={fileRef} accept=".xlsx,.xls,.csv" hidden onChange={readExcel} type="file" /><FileUploadRoundedIcon color="primary" /><Typography sx={{ fontWeight: 850, mt: 1 }}>File gồm: {usesGrades ? "Tên lớp, Khối, Giáo viên phụ trách, Sĩ số" : "Tên lớp, Giáo viên phụ trách, Sĩ số"}</Typography><Typography color="text.secondary" variant="body2">Hệ thống tự nhận diện cột, kiểm tra khối và lớp trùng trước khi tạo.</Typography><Button disabled={loading} onClick={() => fileRef.current?.click()} sx={{ mt: 2 }} variant="outlined">Chọn file lớp</Button></Paper> : null}
      {source === 2 ? <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}><TextField fullWidth label="Đường dẫn Google Sheets" value={url} onChange={(event) => setUrl(event.target.value)} /><Button disabled={loading || !url.trim()} onClick={readSheet} sx={{ minWidth: 150 }} variant="contained">Đọc dữ liệu</Button></Box> : null}
      {loading ? <PreviewSkeleton /> : null}
      {!loading && source !== 0 && message ? <Alert severity={preview.length ? (invalidCount ? "warning" : "success") : "error"}>{message}</Alert> : null}
      {!loading && source !== 0 && preview.length ? <PreviewTable detectedGrades={detectedGrades} invalidCount={invalidCount} rows={preview} sourceName={sourceName} usesGrades={usesGrades} /> : null}
    </DialogContent>
    <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 2 }}>
      <Typography color={invalidCount ? "warning.main" : "text.secondary"} variant="body2">{source === 0 ? "Tạo một lớp thủ công" : invalidCount ? `${invalidCount} dòng cần sửa trong nguồn trước khi tạo` : `${confirmCount} lớp sẵn sàng tạo`}</Typography>
      <Box sx={{ display: "flex", gap: 1 }}><Button disabled={importing} onClick={onClose}>Hủy</Button><Button disabled={!canConfirm || importing} onClick={confirm} startIcon={importing ? <CircularProgress color="inherit" size={16} /> : <CheckCircleRoundedIcon />} variant="contained">{importing ? "Đang tạo..." : `Xác nhận tạo ${confirmCount} lớp`}</Button></Box>
    </DialogActions>
  </Dialog>;
}

function PreviewTable({ detectedGrades, invalidCount, rows, sourceName, usesGrades }: { detectedGrades: string[]; invalidCount: number; rows: ClassImportPreviewRow[]; sourceName: string; usesGrades: boolean }) {
  return <Box sx={{ minWidth: 0 }}><Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}><Chip color="primary" label={`${rows.length} lớp`} size="small" />{usesGrades ? <Chip label={`${detectedGrades.length} khối: ${detectedGrades.join(", ") || "—"}`} size="small" variant="outlined" /> : null}<Chip color={invalidCount ? "warning" : "success"} label={invalidCount ? `${invalidCount} dòng lỗi` : "Tất cả hợp lệ"} size="small" /><Typography color="text.secondary" sx={{ ml: "auto" }} variant="caption">Nguồn: {sourceName}</Typography></Box><TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: 360 }}><Table stickyHeader size="small" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Dòng</TableCell><TableCell>Tên lớp</TableCell>{usesGrades ? <TableCell>Khối</TableCell> : null}<TableCell>Giáo viên phụ trách</TableCell><TableCell align="right">Sĩ số</TableCell><TableCell>Kiểm tra</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow hover key={`${row.sourceRow}-${row.name}`}><TableCell>{row.sourceRow}</TableCell><TableCell sx={{ fontWeight: 800 }}>{row.name || "—"}</TableCell>{usesGrades ? <TableCell>{row.grade || "—"}</TableCell> : null}<TableCell>{row.homeroomTeacher || "Chưa gán"}</TableCell><TableCell align="right">{row.studentCount}</TableCell><TableCell>{row.valid ? <Chip color="success" icon={<CheckCircleRoundedIcon />} label="Hợp lệ" size="small" /> : <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}><ErrorOutlineRoundedIcon color="warning" fontSize="small" /><Typography color="warning.main" variant="caption">{row.issues.join(" · ")}</Typography></Box>}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Box>;
}

function PreviewSkeleton() {
  return <Box sx={{ display: "grid", gap: 1 }}><Box sx={{ display: "flex", gap: 1 }}><Skeleton height={28} variant="rounded" width={90} /><Skeleton height={28} variant="rounded" width={130} /><Skeleton height={28} variant="rounded" width={110} /></Box><Skeleton height={44} variant="rounded" />{Array.from({ length: 5 }, (_, index) => <Skeleton height={38} key={index} variant="rounded" />)}</Box>;
}
