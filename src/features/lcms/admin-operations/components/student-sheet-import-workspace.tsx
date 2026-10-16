import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";

import { DashboardMetricCard, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { bulkCreateStudentAccounts, type BulkStudentAccountResponse } from "@/features/lcms/admin-operations/api/student-account-import-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { ManagementScope } from "@/types/scope-types";
import {
  fetchGoogleSheetTabs,
  loadGoogleSheetViaJsonp,
  parseGoogleSheetUrl,
  type GoogleSheetTab as SheetTab,
  type GoogleVisualizationCell as GvizCell,
  type GoogleVisualizationResponse as GvizResponse,
} from "@/features/lcms/imports/google-sheets-csv-adapter";

type ParsedStudentRow = {
  id: string;
  sourceIndex: number;
  rowNumber: string;
  fullName: string;
  familyName: string;
  givenName: string;
  birthday: string;
  phone: string;
  attendanceCode: string;
  className: string;
  schoolName: string;
  generatedUsername: string;
  generatedPassword: string;
  status: "valid" | "warning";
  note: string;
};

type ParsedSheetResult = {
  detectedSchoolName: string;
  detectedClasses: string[];
  headerIndex: number;
  sourceRowCount: number;
  students: ParsedStudentRow[];
};

type ParseOptions = {
  columnStart: string;
  columnEnd: string;
  rowStart: number;
  rowEnd: number;
};

const demoSheetUrl =
  "https://docs.google.com/spreadsheets/d/13cxEqwXu--jm9u8Exw4YmyWlqvrV-ocU/edit?gid=477743243#gid=477743243";

type StudentSheetImportWorkspaceProps = {
  managementScope: ManagementScope;
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  compact?: boolean;
  lockedCenter?: {
    id: string;
    name: string;
  };
};

export function StudentSheetImportWorkspace({
  centers,
  classes,
  compact = false,
  lockedCenter,
  managementScope,
}: StudentSheetImportWorkspaceProps) {
  const [sheetUrl, setSheetUrl] = useState(demoSheetUrl);
  const [lastLoadedUrl, setLastLoadedUrl] = useState("");
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [result, setResult] = useState<ParsedSheetResult | null>(null);
  const [editableStudents, setEditableStudents] = useState<ParsedStudentRow[]>([]);
  const [excludedStudentIds, setExcludedStudentIds] = useState<Set<string>>(() => new Set());
  const [rangeStart, setRangeStart] = useState("A1");
  const [rangeEnd, setRangeEnd] = useState("Z46");
  const [usernameColumn, setUsernameColumn] = useState("AA");
  const [passwordColumn, setPasswordColumn] = useState("AB");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<BulkStudentAccountResponse | null>(null);
  const [targetCenterId, setTargetCenterId] = useState(() => lockedCenter?.id ?? (managementScope.level === "global" ? centers[0]?.id ?? "" : managementScope.centerId));
  const [targetClassId, setTargetClassId] = useState(() => (managementScope.level === "class" ? managementScope.classId : ""));
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    paceStateUpdate(() => {
      if (lockedCenter) {
        setTargetCenterId(lockedCenter.id);
        setTargetClassId("");
        return;
      }

      if (managementScope.level === "global") {
        setTargetCenterId((current) => current || centers[0]?.id || "");
        return;
      }

      setTargetCenterId(managementScope.centerId);
      setTargetClassId(managementScope.level === "class" ? managementScope.classId : "");
    });
  }, [centers, lockedCenter, managementScope, paceStateUpdate]);

  const centerOptions = useMemo(() => {
    if (!lockedCenter || centers.some((center) => center.id === lockedCenter.id)) {
      return centers;
    }

    return [
      {
        id: lockedCenter.id,
        name: lockedCenter.name,
        activeClasses: 0,
        activeStudents: 0,
        averageScore: 0,
        clusterId: "central",
        completionRate: 0,
        flaggedStudents: 0,
        overdueAssignments: 0,
        principal: "",
      } satisfies ClassroomSchool,
      ...centers,
    ];
  }, [centers, lockedCenter]);

  const targetClasses = useMemo(() => {
    return classes.filter((classroom) => !targetCenterId || classroom.schoolId === targetCenterId);
  }, [classes, targetCenterId]);

  const visibleStudents = useMemo(() => {
    return editableStudents.filter((student) => {
      if (excludedStudentIds.has(student.id)) return false;
      return true;
    });
  }, [editableStudents, excludedStudentIds]);

  const validCount = visibleStudents.filter((student) => student.status === "valid").length;
  const warningCount = visibleStudents.filter((student) => student.status === "warning").length;
  const excludedCount = excludedStudentIds.size;
  const selectedSheetLabel = selectedSheetName || "Theo gid trong link";
  const centerId = targetCenterId || "";
  const classId = targetClassId || undefined;

  const summaryText = useMemo(() => {
    if (!result) return "Chưa có dữ liệu";

    const classText = result.detectedClasses.length > 0 ? result.detectedClasses.join(", ") : "chưa xác định lớp";
    return `${result.detectedSchoolName || "Chưa xác định trường"} · ${classText}`;
  }, [result]);

  const loadSheet = useCallback(
    async (nextUrl: string, sheetNameOverride?: string) => {
      const trimmedUrl = nextUrl.trim();
      if (!trimmedUrl) return;

      setIsLoading(true);
      setErrorMessage("");

      try {
        const parsedUrl = parseGoogleSheetUrl(trimmedUrl);
        const nextTabs = await fetchGoogleSheetTabs(parsedUrl.spreadsheetId).catch(() => []);
        const requestedSheetName = sheetNameOverride ?? selectedSheetName;
        const activeSheetName =
          requestedSheetName && (!nextTabs.length || nextTabs.some((tab) => tab.name === requestedSheetName))
            ? requestedSheetName
            : "";
        const payload = await loadGoogleSheetViaJsonp({
          ...parsedUrl,
          sheetName: activeSheetName || undefined,
        });
        const range = parseCellRange(rangeStart, rangeEnd);
        const parsedSheet = parseStudentSheet(payload, range);
        const detectedSheetName =
          activeSheetName ||
          nextTabs.find((tab) => parsedSheet.detectedClasses.includes(tab.name))?.name ||
          "";

        setSheetTabs(nextTabs);
        setSelectedSheetName(detectedSheetName);
        setResult(parsedSheet);
        setEditableStudents(parsedSheet.students);
        setExcludedStudentIds(new Set());
        setSubmitResult(null);
        setLastLoadedUrl(`${trimmedUrl}|${detectedSheetName}|${rangeStart}:${rangeEnd}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không đọc được Google Sheet.";
        setErrorMessage(message);
        setResult(null);
        setEditableStudents([]);
        setExcludedStudentIds(new Set());
      } finally {
        setIsLoading(false);
      }
    },
    [rangeEnd, rangeStart, selectedSheetName],
  );
  const autoLoadSheet = useDebouncedCallback((url: string, sheetName: string) => {
    void loadSheet(url, sheetName);
  }, 700);

  useEffect(() => {
    const trimmedUrl = sheetUrl.trim();
    const loadKey = `${trimmedUrl}|${selectedSheetName}|${rangeStart}:${rangeEnd}`;
    if (!trimmedUrl.includes("docs.google.com/spreadsheets") || loadKey === lastLoadedUrl) return;

    autoLoadSheet.run(trimmedUrl, selectedSheetName);
  }, [autoLoadSheet, lastLoadedUrl, rangeEnd, rangeStart, selectedSheetName, sheetUrl]);

  const updateStudent = useCallback(
    (studentId: string, field: keyof Pick<ParsedStudentRow, "fullName" | "className" | "birthday" | "phone" | "generatedUsername" | "generatedPassword">, value: string) => {
      setEditableStudents((students) =>
        students.map((student) => {
          if (student.id !== studentId) return student;

          const nextStudent = { ...student, [field]: value };
          const hasRequiredData = Boolean(nextStudent.fullName.trim() && nextStudent.className.trim());

          return {
            ...nextStudent,
            status: hasRequiredData ? "valid" : "warning",
            note: hasRequiredData ? "Hợp lệ" : "Cần kiểm tra",
          };
        }),
      );
    },
    [],
  );

  const excludeStudent = useCallback((studentId: string) => {
    setExcludedStudentIds((current) => {
      const next = new Set(current);
      next.add(studentId);
      return next;
    });
  }, []);

  const restoreAllStudents = useCallback(() => {
    setExcludedStudentIds(new Set());
  }, []);

  const submitAccounts = useCallback(async () => {
    if (!centerId) {
      setErrorMessage("Vui lòng chọn trường/trung tâm trước khi tạo tài khoản học sinh.");
      return;
    }
    if (!visibleStudents.length) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSubmitResult(null);

    try {
      const response = await bulkCreateStudentAccounts({
        centerId,
        classId,
        rows: visibleStudents.map((student) => ({
          rowId: student.id,
          rowNumber: Number.parseInt(student.rowNumber, 10) || student.sourceIndex,
          included: true,
          fullName: student.fullName,
          className: student.className,
          username: student.generatedUsername,
          password: student.generatedPassword,
          birthday: parseBirthdayForApi(student.birthday),
          phone: student.phone,
          note: student.note,
        })),
      });
      setSubmitResult(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tạo tài khoản học sinh từ BE.");
    } finally {
      setIsSubmitting(false);
    }
  }, [centerId, classId, visibleStudents]);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: compact ? "1fr" : { xs: "1fr", xl: "minmax(0, 1fr) 340px" }, gap: 2 }}>
      <Stack spacing={2}>
        <DashboardSectionCard
          title={lockedCenter ? "Import danh sách lớp" : "Nhập học sinh từ Google Sheet"}
          description={
            lockedCenter
              ? `Dữ liệu sẽ được gắn vào ${lockedCenter.name}. Kiểm tra lớp và học sinh trước khi tạo tài khoản LMS.`
              : "Dán link, chọn đơn vị đích, xem trước dữ liệu rồi tạo tài khoản LMS."
          }
        >
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)" }}>
              <Box component="label" sx={{ display: "block" }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  <TableViewOutlinedIcon sx={{ color: "success.main", fontSize: 18 }} /> Đường dẫn Google Sheet
                </Stack>
                <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12 }}>Sheet cần bật quyền xem bằng liên kết.</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={sheetUrl}
                    onChange={(event) => setSheetUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void loadSheet(sheetUrl);
                      }
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => void loadSheet(sheetUrl)}
                    disabled={isLoading}
                    sx={{ minHeight: 40, flexShrink: 0, borderRadius: 1.25, px: 2.5, fontSize: 12, fontWeight: 700, textTransform: "none" }}
                  >
                    {isLoading ? "Đang xử lý..." : "Đồng bộ dữ liệu"}
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                <Box>
                  <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 700 }}>{lockedCenter ? "Trường đang import" : "Đơn vị đích"}</Typography>
                  <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>
                    {lockedCenter ? "Import được thực hiện trong phạm vi trường này." : "Tài khoản được gắn vào trường/lớp đã chọn."}
                  </Typography>
                </Box>
                <Chip size="small" color="secondary" label={lockedCenter ? "Đúng phạm vi trường" : "BE realtime"} />
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5, mt: 2 }}>
                {lockedCenter ? (
                  <Paper variant="outlined" sx={{ borderRadius: 1.25, px: 1.5, py: 1.25 }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>Trường</Typography>
                    <Typography noWrap sx={{ mt: 0.5, color: "text.primary", fontSize: 14, fontWeight: 700 }}>{lockedCenter.name}</Typography>
                  </Paper>
                ) : (
                  <ImportField label="Trường / Trung tâm">
                    <TextField select fullWidth size="small"
                      value={targetCenterId}
                      onChange={(event) => {
                        setTargetCenterId(event.target.value);
                        setTargetClassId("");
                      }}
                      disabled={managementScope.level !== "global" && centers.length <= 1}
                    >
                      <MenuItem value="">Chọn cơ sở thụ hưởng</MenuItem>
                      {centerOptions.map((center) => (
                        <MenuItem key={center.id} value={center.id}>
                          {center.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </ImportField>
                )}
                <ImportField label="Lớp học đích">
                  <TextField select fullWidth size="small"
                    value={targetClassId}
                    onChange={(event) => setTargetClassId(event.target.value)}
                    disabled={managementScope.level === "class"}
                  >
                    <MenuItem value="">Tự động nhận theo cột Lớp trong Sheet</MenuItem>
                    {targetClasses.map((classroom) => (
                      <MenuItem key={classroom.id} value={classroom.id}>
                        {classroom.className}
                      </MenuItem>
                    ))}
                  </TextField>
                </ImportField>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)" }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                <Box>
                  <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 700 }}>Khoảng dữ liệu</Typography>
                  <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>Chọn tab và vùng ô cần đọc.</Typography>
                </Box>
                <Chip size="small" variant="outlined" label={selectedSheetLabel} />
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(200px, 1.5fr) repeat(2, minmax(0, 1fr))" }, gap: 1.5, mt: 2 }}>
                <ImportField label="Tab Sheet cần đọc">
                  <TextField select fullWidth size="small"
                    value={selectedSheetName}
                    onChange={(event) => {
                      const nextSheetName = event.target.value;
                      setSelectedSheetName(nextSheetName);
                      void loadSheet(sheetUrl, nextSheetName);
                    }}
                  >
                    <MenuItem value="">Chọn theo mặc định (Tab đầu)</MenuItem>
                    {sheetTabs.map((tab) => (
                      <MenuItem key={tab.name} value={tab.name}>
                        {tab.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </ImportField>
                <ImportField label="Tọa độ bắt đầu"><TextField size="small" fullWidth value={rangeStart} onChange={(event) => setRangeStart(event.target.value.toUpperCase())} placeholder="A1" sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
                <ImportField label="Tọa độ kết thúc"><TextField size="small" fullWidth value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value.toUpperCase())} placeholder="Z100" sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
              </Box>

              {sheetTabs.length > 0 && (
                <Box sx={{ pt: 2 }}>
                  <Typography sx={{ mb: 1, color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Chuyển đổi nhanh các tab lớp</Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {sheetTabs.slice(0, 10).map((tab) => (
                      <Button
                        key={tab.name}
                        type="button"
                        variant={selectedSheetName === tab.name ? "contained" : "outlined"}
                        onClick={() => {
                          setSelectedSheetName(tab.name);
                          void loadSheet(sheetUrl, tab.name);
                        }}
                        sx={{ minHeight: 30, borderRadius: 1, px: 1.5, py: 0.75, fontSize: 12, fontWeight: 600, textTransform: "none" }}
                      >
                        {tab.name}
                      </Button>
                    ))}
                    {sheetTabs.length > 10 && (
                      <Chip variant="outlined" size="small" label={
                        <>
                        +{sheetTabs.length - 10} tab khác
                        </>
                      } sx={{ fontSize: 12, fontWeight: 600 }} />
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>

            {errorMessage ? (
              <Box sx={{ border: 1, borderColor: "error.light", borderRadius: 1.5, bgcolor: "error.50", color: "error.dark", px: 2, py: 1.5, fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>
                {errorMessage}
              </Box>
            ) : null}

            {/* Metrics cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
              <DashboardMetricCard label="Tổng học sinh nhận diện" value={String(visibleStudents.length)} detail={summaryText} tone="blue" />
              <DashboardMetricCard label="Dòng hợp lệ" value={String(validCount)} detail="Đầy đủ thông tin định danh" tone="emerald" />
              <DashboardMetricCard label="Cần rà soát lại" value={String(warningCount)} detail="Thiếu thông tin hoặc định dạng lỗi" tone="amber" />
            </Box>
          </Stack>
        </DashboardSectionCard>

        {/* Preview Table Card */}
        <DashboardSectionCard
          title="Bảng xem trước dữ liệu học sinh"
          description="Cho phép chỉnh sửa trực tiếp thông tin lỗi của học sinh trước khi gửi dữ liệu lên máy chủ."
          action={
            excludedCount > 0 ? (
              <Button variant="outlined" size="small" onClick={restoreAllStudents} sx={{ minHeight: 32, fontSize: 12, textTransform: "none" }} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}>
                Khôi phục {excludedCount} dòng đã bỏ
              </Button>
            ) : null
          }
        >
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 580, borderRadius: 1.5 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "action.hover", color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" } }}>
                    <TableCell align="center" sx={{ width: 64 }}>STT</TableCell>
                    <TableCell sx={{ width: 288 }}>Họ & Tên học sinh</TableCell>
                    <TableCell sx={{ width: 128 }}>Lớp</TableCell>
                    <TableCell sx={{ width: 160 }}>Ngày sinh</TableCell>
                    <TableCell sx={{ width: 160 }}>Số điện thoại</TableCell>
                    <TableCell sx={{ width: 192 }}>Tên tài khoản (Gen)</TableCell>
                    <TableCell sx={{ width: 128 }}>Mật khẩu</TableCell>
                    <TableCell align="center" sx={{ width: 144 }}>Trạng thái</TableCell>
                    <TableCell align="center" sx={{ width: 96 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleStudents.map((student) => {
                    const isValid = student.status === "valid";
                    return (
                      <TableRow
                        key={student.id} 
                        hover
                        sx={{ bgcolor: isValid ? "background.paper" : "warning.50", "& td": { py: 1.25, fontSize: 12 } }}
                      >
                        <TableCell align="center">
                          <Box component="span" sx={{ display: "inline-flex", width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 0.75, bgcolor: "action.hover", color: "text.secondary", fontSize: 10, fontWeight: 700 }}>
                            {student.rowNumber || student.sourceIndex}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0, bgcolor: "primary.50", color: "primary.main", fontSize: 10, fontWeight: 700 }}>
                              {getInitials(student.fullName)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <EditableCell
                                value={student.fullName} 
                                onChange={(e) => updateStudent(student.id, "fullName", e.target.value)}
                                bold
                              />
                              <Typography noWrap sx={{ mt: 0.25, color: "text.secondary", fontSize: 10 }}>{student.schoolName || "Cơ sở chưa phân loại"}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={student.className} 
                            onChange={(e) => updateStudent(student.id, "className", e.target.value)}
                            bold
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={student.birthday} 
                            onChange={(e) => updateStudent(student.id, "birthday", e.target.value)}
                            placeholder="DD/MM/YYYY"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={student.phone} 
                            onChange={(e) => updateStudent(student.id, "phone", e.target.value)}
                            placeholder="Chưa cập nhật SĐT"
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={student.generatedUsername} 
                            onChange={(e) => updateStudent(student.id, "generatedUsername", e.target.value)}
                            mono
                          />
                        </TableCell>
                        <TableCell>
                          <EditableCell
                            value={student.generatedPassword} 
                            onChange={(e) => updateStudent(student.id, "generatedPassword", e.target.value)}
                            mono
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" variant="outlined" color={isValid ? "success" : "warning"} label={student.note} sx={{ height: 22, fontSize: 10, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            aria-label={`Bỏ dòng ${student.rowNumber || student.sourceIndex}`}
                            variant="text"
                            size="small"
                            color="error"
                            onClick={() => excludeStudent(student.id)}
                            sx={{ minWidth: 32, minHeight: 32 }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {result && visibleStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary", fontWeight: 600 }}>
                        Không còn học sinh nào phù hợp trong khoảng lựa chọn.
                      </TableCell>
                    </TableRow>
                  )}

                  {!result && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary", fontWeight: 700 }}>
                        Vui lòng nhập đường dẫn Google Sheet phía trên để tải và cấu hình dữ liệu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </TableContainer>
        </DashboardSectionCard>
      </Stack>

      {/* Right Sidebar Control */}
      <Box sx={compact ? { display: { xl: "grid" }, gridTemplateColumns: { xl: "minmax(0, 1fr) 320px" }, alignItems: { xl: "start" }, gap: 2 } : undefined}>
        <DashboardSectionCard 
          title="Đồng bộ về Sheet" 
          description="Cấu hình trả kết quả tài khoản đã khởi tạo về tệp Google Sheet gốc."
        >
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
              <ImportField label="Cột Tên đăng nhập"><TextField size="small" fullWidth value={usernameColumn} onChange={(event) => setUsernameColumn(event.target.value.toUpperCase())} sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
              <ImportField label="Cột Mật khẩu"><TextField size="small" fullWidth value={passwordColumn} onChange={(event) => setPasswordColumn(event.target.value.toUpperCase())} sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
            </Box>

            <Stack spacing={1.25} sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
              <RuleLine label="Đầu vào Tab" value={selectedSheetLabel} />
              <RuleLine label="Định danh Auth" value="Khởi tạo thật, chống trùng lặp" />
              <RuleLine label="Mật khẩu mặc định" value="123456" />
              <RuleLine label="Cột ghi nhận kết quả" value={`${usernameColumn || "AA"} / ${passwordColumn || "AB"}`} />
              <RuleLine label="Quyền hạn ghi tệp" value="OAuth 2.0 / Service Account" />
            </Stack>

            {submitResult && (
              <Paper variant="outlined" sx={{ borderColor: "success.light", borderRadius: 1.5, bgcolor: "success.50", color: "success.dark", px: 2, py: 1.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.6 }}>
                  Hoàn tất: BE đã khởi tạo {submitResult.created} tài khoản, bỏ qua {submitResult.skipped}, trùng lặp {submitResult.duplicates}.
                </Typography>
                {submitResult.credentials.length > 0 && (
                  <Box sx={{ borderRadius: 1, bgcolor: "background.paper", p: 1.25, mt: 1, fontFamily: "JetBrains Mono, monospace" }}>
                    <Typography sx={{ mb: 0.5, color: "text.primary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Tài khoản mẫu mới tạo</Typography>
                    <Stack spacing={0.5} sx={{ color: "text.secondary", fontSize: 10 }}>
                      {submitResult.credentials.slice(0, 5).map((item) => (
                        <Box component="span" key={item.rowId}>
                          Dòng {item.rowNumber}: {item.username} / {item.password}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ minHeight: 40, borderRadius: 1.5, fontSize: 12, fontWeight: 700, textTransform: "none" }}
              onClick={() => void submitAccounts()}
              disabled={!visibleStudents.length || !centerId || isSubmitting}
            >
              {isSubmitting ? "Đang truyền dữ liệu..." : `Khởi tạo ${visibleStudents.length} tài khoản`}
            </Button>
          </Stack>
        </DashboardSectionCard>
      </Box>
    </Box>
  );
}

function ImportField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ display: "grid", gap: 1, color: "text.secondary", fontSize: 12, fontWeight: 700 }}>
      {label}
      {children}
    </Box>
  );
}

function EditableCell({
  bold = false,
  mono = false,
  onChange,
  placeholder,
  value,
}: {
  bold?: boolean;
  mono?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      variant="standard"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      slotProps={{ input: { disableUnderline: true } }}
      sx={{
        "& .MuiInputBase-root": {
          borderBottom: 1,
          borderColor: "transparent",
          fontFamily: mono ? "JetBrains Mono, monospace" : "inherit",
          fontSize: 12,
          fontWeight: bold ? 700 : 500,
          "&:hover": { borderColor: "divider" },
          "&.Mui-focused": { borderColor: "primary.main" },
        },
      }}
    />
  );
}

function parseStudentSheet(payload: GvizResponse, options: ParseOptions): ParsedSheetResult {
  const cols = payload.table?.cols ?? [];
  const gvizRows = payload.table?.rows ?? [];
  const rows = [
    cols.map((col) => col.label ?? ""),
    ...gvizRows.map((row) => cols.map((_, index) => getCellText(row.c?.[index] ?? null))),
  ];
  const columnSlicedRows = sliceRowsByColumnRange(rows, options.columnStart, options.columnEnd);
  const slicedRows = sliceRowsByRowRange(columnSlicedRows, options.rowStart, options.rowEnd);

  const headerIndex = slicedRows.findIndex((row) => {
    const normalizedRow = row.map(normalizeText);
    return normalizedRow.includes("HO") && normalizedRow.includes("TEN") && normalizedRow.includes("LOP");
  });

  if (headerIndex < 0) {
    throw new Error("Không tìm thấy dòng tiêu đề có HỌ, TÊN và LỚP trong vùng cột đang chọn.");
  }

  const headerRow = slicedRows[headerIndex];
  const rowNumberIndex = findHeaderIndex(headerRow, "STT");
  const familyNameIndex = findHeaderIndex(headerRow, "HO");
  const givenNameIndex = findHeaderIndex(headerRow, "TEN");
  const birthdayIndex = findHeaderIndex(headerRow, "NGAY SINH");
  const phoneIndex = findHeaderIndex(headerRow, "SO SDT");
  const attendanceCodeIndex = findHeaderIndex(headerRow, "MA D D");
  const classIndex = findHeaderIndex(headerRow, "LOP");
  const schoolName = detectSchoolName(slicedRows.slice(0, headerIndex));
  const usernameCounts = new Map<string, number>();

  const students = slicedRows
    .slice(headerIndex + 1)
    .filter((row) => {
      const familyName = getColumn(row, familyNameIndex);
      const givenName = getColumn(row, givenNameIndex);
      const className = getColumn(row, classIndex);
      return Boolean(familyName || givenName || className);
    })
    .map((row, index): ParsedStudentRow => {
      const familyName = getColumn(row, familyNameIndex);
      const givenName = getColumn(row, givenNameIndex);
      const fullName = [familyName, givenName].filter(Boolean).join(" ").trim();
      const className = getColumn(row, classIndex);
      const generatedUsername = fullName && className ? createUniqueUsername(fullName, className, usernameCounts) : "";
      const generatedPassword = "123456";
      const status = fullName && className ? "valid" : "warning";

      return {
        id: `${index}-${fullName}-${className}`,
        sourceIndex: index + 1,
        rowNumber: getColumn(row, rowNumberIndex) || String(index + 1),
        fullName: fullName || "Chưa có họ tên",
        familyName,
        givenName,
        birthday: getColumn(row, birthdayIndex),
        phone: getColumn(row, phoneIndex),
        attendanceCode: getColumn(row, attendanceCodeIndex),
        className,
        schoolName,
        generatedUsername,
        generatedPassword,
        status,
        note: status === "valid" ? "Hợp lệ" : "Cần kiểm tra",
      };
    });

  return {
    detectedSchoolName: schoolName,
    detectedClasses: Array.from(new Set(students.map((student) => student.className).filter(Boolean))),
    headerIndex,
    sourceRowCount: slicedRows.length,
    students,
  };
}

function getCellText(cell: GvizCell) {
  if (!cell) return "";
  const value = cell.f ?? cell.v ?? "";
  return String(value).trim();
}

function normalizeText(value: string) {
  return value
    .replace(/\n/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function findHeaderIndex(headerRow: string[], expected: string) {
  return headerRow.findIndex((item) => normalizeText(item) === expected);
}

function getColumn(row: string[], index: number) {
  if (index < 0) return "";
  return (row[index] ?? "").trim();
}

function detectSchoolName(rowsBeforeHeader: string[][]) {
  for (const row of rowsBeforeHeader) {
    const schoolLabelIndex = row.findIndex((cell) => normalizeText(cell) === "TRUONG");
    if (schoolLabelIndex >= 0) {
      const nextValue = row.slice(schoolLabelIndex + 1).find((cell) => cell.trim());
      if (nextValue) return nextValue.trim();
    }

    const schoolName = row.find((cell) => normalizeText(cell).includes("TRUONG THCS"));
    if (schoolName) return schoolName.split("\n")[0].trim();
  }

  return "";
}

function sliceRowsByColumnRange(rows: string[][], startColumn: string, endColumn: string) {
  const startIndex = columnNameToIndex(startColumn);
  const endIndex = columnNameToIndex(endColumn);
  const safeStart = Math.min(startIndex, endIndex);
  const safeEnd = Math.max(startIndex, endIndex);

  return rows.map((row) => row.slice(safeStart, safeEnd + 1));
}

function sliceRowsByRowRange(rows: string[][], rowStart: number, rowEnd: number) {
  const safeStart = Math.max(0, Math.min(rowStart, rowEnd) - 1);
  const safeEnd = Math.max(rowStart, rowEnd);

  return rows.slice(safeStart, safeEnd);
}

function parseCellRange(startCell: string, endCell: string): ParseOptions {
  const start = parseCellPosition(startCell, "A", 1);
  const end = parseCellPosition(endCell, "Z", Number.POSITIVE_INFINITY);

  return {
    columnStart: start.column,
    columnEnd: end.column,
    rowStart: start.row,
    rowEnd: end.row,
  };
}

function parseCellPosition(value: string, fallbackColumn: string, fallbackRow: number) {
  const match = value.trim().toUpperCase().match(/^([A-Z]+)\s*(\d+)?$/);

  return {
    column: match?.[1] ?? fallbackColumn,
    row: match?.[2] ? Number(match[2]) : fallbackRow,
  };
}

function columnNameToIndex(columnName: string) {
  const normalized = columnName.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!normalized) return 0;

  return normalized.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function createUniqueUsername(fullName: string, className: string, usernameCounts: Map<string, number>) {
  const parts = toSlug(fullName).split(".").filter(Boolean);
  const firstName = parts.at(-1) ?? "hs";
  const familyName = parts[0] ?? "erg";
  const classSlug = toSlug(className).replace(/\./g, "");
  const baseUsername = [firstName, familyName, classSlug].filter(Boolean).join(".");
  const currentCount = usernameCounts.get(baseUsername) ?? 0;
  usernameCounts.set(baseUsername, currentCount + 1);
  const randomSuffix = Math.random().toString(36).slice(2, 6);

  return currentCount === 0 ? `${baseUsername}.${randomSuffix}` : `${baseUsername}${currentCount + 1}.${randomSuffix}`;
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "H";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function parseBirthdayForApi(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const dateMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!dateMatch) return undefined;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const rawYear = Number(dateMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}



function RuleLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between", borderRadius: 1, bgcolor: "action.hover", px: 1.5, py: 1 }}>
      <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}
