import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, FileSpreadsheet } from "@/components/mui-icon-shim";

import { DashboardMetricCard, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkCreateStudentAccounts, type BulkStudentAccountResponse } from "@/features/lcms/admin-operations/api/student-account-import-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { ManagementScope } from "@/types/scope-types";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";

type GvizCell = {
  v?: string | number | boolean | null;
  f?: string | null;
} | null;

type GvizResponse = {
  table?: {
    cols?: Array<{ label?: string }>;
    rows?: Array<{ c?: GvizCell[] }>;
  };
};

type SheetTab = {
  name: string;
};

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
        const nextTabs = await loadGoogleSheetTabs(parsedUrl.spreadsheetId).catch(() => []);
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
    <div className={cn("grid gap-4", compact ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_340px]")}>
      <div className="space-y-4">
        <DashboardSectionCard
          title={lockedCenter ? "Import danh sách lớp" : "Nhập học sinh từ Google Sheet"}
          description={
            lockedCenter
              ? `Dữ liệu sẽ được gắn vào ${lockedCenter.name}. Kiểm tra lớp và học sinh trước khi tạo tài khoản LMS.`
              : "Dán link, chọn đơn vị đích, xem trước dữ liệu rồi tạo tài khoản LMS."
          }
        >
          <div className="mt-2 space-y-4">
            <div className="rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-[var(--shadow-xs)]">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Đường dẫn Google Sheet
                </span>
                <p className="mt-1 text-xs text-slate-400">Sheet cần bật quyền xem bằng liên kết.</p>
                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <Input
                    value={sheetUrl}
                    onChange={(event) => setSheetUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void loadSheet(sheetUrl);
                      }
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="h-10 flex-1 rounded-[10px] border-slate-200 text-xs focus:border-[var(--erg-blue)]"
                  />
                  <Button 
                    onClick={() => void loadSheet(sheetUrl)} 
                    disabled={isLoading}
                    className="h-10 shrink-0 rounded-[10px] px-5 text-xs font-bold"
                  >
                    {isLoading ? "Đang xử lý..." : "Đồng bộ dữ liệu"}
                  </Button>
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-[#d9e2ef] bg-[#f8fbff] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9e2ef] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{lockedCenter ? "Trường đang import" : "Đơn vị đích"}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {lockedCenter ? "Import được thực hiện trong phạm vi trường này." : "Tài khoản được gắn vào trường/lớp đã chọn."}
                  </p>
                </div>
                <Badge tone="secondary">{lockedCenter ? "Đúng phạm vi trường" : "BE realtime"}</Badge>
              </div>
              <div className={cn("mt-4 grid gap-3", lockedCenter ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "sm:grid-cols-2")}>
                {lockedCenter ? (
                  <div className="rounded-[10px] border border-slate-200/80 bg-white px-3 py-2.5">
                    <span className="block text-xs font-bold text-slate-500">Trường</span>
                    <span className="mt-1 block truncate text-sm font-bold text-slate-800">{lockedCenter.name}</span>
                  </div>
                ) : (
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500">Trường / Trung tâm</span>
                    <AppSelect
                      className="mt-2 h-10 w-full rounded-[10px] border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                      value={targetCenterId}
                      onChange={(event) => {
                        setTargetCenterId(event.target.value);
                        setTargetClassId("");
                      }}
                      disabled={managementScope.level !== "global" && centers.length <= 1}
                    >
                      <option value="">Chọn cơ sở thụ hưởng</option>
                      {centerOptions.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </AppSelect>
                  </label>
                )}
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Lớp học đích</span>
                  <AppSelect
                    className="mt-2 h-10 w-full rounded-[10px] border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                    value={targetClassId}
                    onChange={(event) => setTargetClassId(event.target.value)}
                    disabled={managementScope.level === "class"}
                  >
                    <option value="">Tự động nhận theo cột Lớp trong Sheet</option>
                    {targetClasses.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.className}
                      </option>
                    ))}
                  </AppSelect>
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#d9e2ef] bg-white p-4 shadow-[var(--shadow-xs)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Khoảng dữ liệu</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Chọn tab và vùng ô cần đọc.</p>
                </div>
                <Badge tone="outline">{selectedSheetLabel}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(200px,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Tab Sheet cần đọc</span>
                  <AppSelect
                    className="mt-2 h-10 w-full rounded-[10px] border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                    value={selectedSheetName}
                    onChange={(event) => {
                      const nextSheetName = event.target.value;
                      setSelectedSheetName(nextSheetName);
                      void loadSheet(sheetUrl, nextSheetName);
                    }}
                  >
                    <option value="">Chọn theo mặc định (Tab đầu)</option>
                    {sheetTabs.map((tab) => (
                      <option key={tab.name} value={tab.name}>
                        {tab.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Tọa độ bắt đầu</span>
                  <Input className="mt-2 h-10 rounded-[10px] uppercase" value={rangeStart} onChange={(event) => setRangeStart(event.target.value.toUpperCase())} placeholder="A1" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Tọa độ kết thúc</span>
                  <Input className="mt-2 h-10 rounded-[10px] uppercase" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value.toUpperCase())} placeholder="Z100" />
                </label>
              </div>

              {sheetTabs.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Chuyển đổi nhanh các tab lớp</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sheetTabs.slice(0, 10).map((tab) => (
                      <button
                        key={tab.name}
                        type="button"
                        onClick={() => {
                          setSelectedSheetName(tab.name);
                          void loadSheet(sheetUrl, tab.name);
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-tight transition duration-150",
                          selectedSheetName === tab.name
                            ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {tab.name}
                      </button>
                    ))}
                    {sheetTabs.length > 10 && (
                      <span className="text-xs font-semibold text-slate-400 bg-white border border-slate-200/60 rounded-lg px-2.5 py-1.5">
                        +{sheetTabs.length - 10} tab khác
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 leading-relaxed">
                {errorMessage}
              </div>
            ) : null}

            {/* Metrics cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <DashboardMetricCard label="Tổng học sinh nhận diện" value={String(visibleStudents.length)} detail={summaryText} tone="blue" />
              <DashboardMetricCard label="Dòng hợp lệ" value={String(validCount)} detail="Đầy đủ thông tin định danh" tone="emerald" />
              <DashboardMetricCard label="Cần rà soát lại" value={String(warningCount)} detail="Thiếu thông tin hoặc định dạng lỗi" tone="amber" />
            </div>
          </div>
        </DashboardSectionCard>

        {/* Preview Table Card */}
        <DashboardSectionCard
          title="Bảng xem trước dữ liệu học sinh"
          description="Cho phép chỉnh sửa trực tiếp thông tin lỗi của học sinh trước khi gửi dữ liệu lên máy chủ."
          action={
            excludedCount > 0 ? (
              <Button variant="outline" size="sm" onClick={restoreAllStudents} className="text-xs h-8">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Khôi phục {excludedCount} dòng đã bỏ
              </Button>
            ) : null
          }
        >
          <div className="mt-4 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">STT</th>
                    <th className="py-3 px-4 w-72">Họ & Tên học sinh</th>
                    <th className="py-3 px-3 w-32">Lớp</th>
                    <th className="py-3 px-3 w-40">Ngày sinh</th>
                    <th className="py-3 px-3 w-40">Số điện thoại</th>
                    <th className="py-3 px-3 w-48">Tên tài khoản (Gen)</th>
                    <th className="py-3 px-3 w-32">Mật khẩu</th>
                    <th className="py-3 px-4 w-36 text-center">Trạng thái</th>
                    <th className="py-3 px-4 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {visibleStudents.map((student) => {
                    const isValid = student.status === "valid";
                    return (
                      <tr 
                        key={student.id} 
                        className={cn(
                          "hover:bg-slate-50/40 transition duration-150",
                          !isValid && "bg-amber-50/15"
                        )}
                      >
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                            {student.rowNumber || student.sourceIndex}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600">
                              {getInitials(student.fullName)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <input 
                                value={student.fullName} 
                                onChange={(e) => updateStudent(student.id, "fullName", e.target.value)}
                                className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs font-bold text-slate-800"
                              />
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{student.schoolName || "Cơ sở chưa phân loại"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input 
                            value={student.className} 
                            onChange={(e) => updateStudent(student.id, "className", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input 
                            value={student.birthday} 
                            onChange={(e) => updateStudent(student.id, "birthday", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs text-slate-600"
                            placeholder="DD/MM/YYYY"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input 
                            value={student.phone} 
                            onChange={(e) => updateStudent(student.id, "phone", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs text-slate-600"
                            placeholder="Chưa cập nhật SĐT"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input 
                            value={student.generatedUsername} 
                            onChange={(e) => updateStudent(student.id, "generatedUsername", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs font-mono text-slate-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input 
                            value={student.generatedPassword} 
                            onChange={(e) => updateStudent(student.id, "generatedPassword", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-0 p-0 text-xs font-mono text-slate-500"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-bold inline-block",
                            isValid 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200/60" 
                              : "bg-amber-50 text-amber-600 border-amber-200/60"
                          )}>
                            {student.note}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => excludeStudent(student.id)} 
                            className="h-8 text-xs text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {result && visibleStudents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                        Không còn học sinh nào phù hợp trong khoảng lựa chọn.
                      </td>
                    </tr>
                  )}

                  {!result && !isLoading && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                        Vui lòng nhập đường dẫn Google Sheet phía trên để tải và cấu hình dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      {/* Right Sidebar Control */}
      <div className={cn("space-y-4", compact && "xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-4 xl:space-y-0")}>
        <DashboardSectionCard 
          title="Đồng bộ về Sheet" 
          description="Cấu hình trả kết quả tài khoản đã khởi tạo về tệp Google Sheet gốc."
        >
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Cột Tên đăng nhập</span>
                <Input className="mt-2 uppercase h-9 rounded-lg" value={usernameColumn} onChange={(event) => setUsernameColumn(event.target.value.toUpperCase())} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Cột Mật khẩu</span>
                <Input className="mt-2 uppercase h-9 rounded-lg" value={passwordColumn} onChange={(event) => setPasswordColumn(event.target.value.toUpperCase())} />
              </label>
            </div>

            <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
              <RuleLine label="Đầu vào Tab" value={selectedSheetLabel} />
              <RuleLine label="Định danh Auth" value="Khởi tạo thật, chống trùng lặp" />
              <RuleLine label="Mật khẩu mặc định" value="123456" />
              <RuleLine label="Cột ghi nhận kết quả" value={`${usernameColumn || "AA"} / ${passwordColumn || "AB"}`} />
              <RuleLine label="Quyền hạn ghi tệp" value="OAuth 2.0 / Service Account" />
            </div>

            {submitResult && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs text-emerald-800 leading-relaxed shadow-sm">
                <p className="font-bold">
                  Hoàn tất: BE đã khởi tạo {submitResult.created} tài khoản, bỏ qua {submitResult.skipped}, trùng lặp {submitResult.duplicates}.
                </p>
                {submitResult.credentials.length > 0 && (
                  <div className="rounded-lg bg-white/70 p-2.5 mt-2 font-mono">
                    <p className="font-bold text-slate-800 mb-1 text-[10px] uppercase tracking-wider">Tài khoản mẫu mới tạo</p>
                    <div className="grid gap-1 text-[10px] text-slate-600">
                      {submitResult.credentials.slice(0, 5).map((item) => (
                        <span key={item.rowId}>
                          Dòng {item.rowNumber}: {item.username} / {item.password}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)] text-xs font-bold h-10 rounded-xl shadow-sm transition" 
              onClick={() => void submitAccounts()} 
              disabled={!visibleStudents.length || !centerId || isSubmitting}
            >
              {isSubmitting ? "Đang truyền dữ liệu..." : `Khởi tạo ${visibleStudents.length} tài khoản`}
            </Button>
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

function parseGoogleSheetUrl(input: string) {
  const idMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = input.match(/[?#&]gid=(\d+)/);

  if (!idMatch?.[1]) {
    throw new Error("Link Google Sheet chưa đúng định dạng.");
  }

  return {
    spreadsheetId: idMatch[1],
    gid: gidMatch?.[1] ?? "0",
  };
}

async function loadGoogleSheetTabs(spreadsheetId: string): Promise<SheetTab[]> {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`);
  if (!response.ok) {
    throw new Error("Không đọc được danh sách tab trong Google Sheet.");
  }

  const html = await response.text();
  const captions = Array.from(html.matchAll(/docs-sheet-tab-caption">([^<]+)</g))
    .map((match) => decodeHtml(match[1] ?? "").trim())
    .filter(Boolean);
  const uniqueCaptions = Array.from(new Set(captions));

  return uniqueCaptions.map((name) => ({ name }));
}

function loadGoogleSheetViaJsonp({
  spreadsheetId,
  gid,
  sheetName,
}: {
  spreadsheetId: string;
  gid: string;
  sheetName?: string;
}) {
  return new Promise<GvizResponse>((resolve, reject) => {
    const callbackName = `__ergSheetImport_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const callbackRegistry = window as unknown as Record<string, (payload: GvizResponse) => void>;

    const cleanup = () => {
      delete callbackRegistry[callbackName];
      script.remove();
      window.clearTimeout(timeoutId);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet phản hồi quá lâu. Kiểm tra lại quyền chia sẻ hoặc tệp sheet."));
    }, 15000);

    callbackRegistry[callbackName] = (payload: GvizResponse) => {
      cleanup();
      if (!payload.table) {
        reject(new Error("Không đọc được dữ liệu trong sheet."));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Không tải được Google Sheet. Tệp sheet cần được cấp quyền xem công khai."));
    };

    const params = new URLSearchParams({
      tqx: `out:json;responseHandler:${callbackName}`,
    });

    if (sheetName) {
      params.set("sheet", sheetName);
    } else {
      params.set("gid", gid);
    }

    script.src = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
    document.body.appendChild(script);
  });
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

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
    <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 text-xs">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-right text-slate-500 font-bold">{value}</span>
    </div>
  );
}
