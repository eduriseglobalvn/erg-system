import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Table2, Trash2, Users } from "lucide-react";

import { DashboardMetricCard, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, Input, inputClassName } from "@/components/ui/dashboard-kit";
import { bulkCreateStudentAccounts, type BulkStudentAccountResponse } from "@/features/admin-operations/api/student-account-import-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import type { ManagementScope } from "@/types/scope-types";

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
};

export function StudentSheetImportWorkspace({ managementScope, centers, classes }: StudentSheetImportWorkspaceProps) {
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
  const [targetCenterId, setTargetCenterId] = useState(() => (managementScope.level === "global" ? centers[0]?.id ?? "" : managementScope.centerId));
  const [targetClassId, setTargetClassId] = useState(() => (managementScope.level === "class" ? managementScope.classId : ""));

  useEffect(() => {
    if (managementScope.level === "global") {
      setTargetCenterId((current) => current || centers[0]?.id || "");
      return;
    }

    setTargetCenterId(managementScope.centerId);
    setTargetClassId(managementScope.level === "class" ? managementScope.classId : "");
  }, [centers, managementScope]);

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

  useEffect(() => {
    const trimmedUrl = sheetUrl.trim();
    const loadKey = `${trimmedUrl}|${selectedSheetName}|${rangeStart}:${rangeEnd}`;
    if (!trimmedUrl.includes("docs.google.com/spreadsheets") || loadKey === lastLoadedUrl) return;

    const timeoutId = window.setTimeout(() => {
      void loadSheet(trimmedUrl, selectedSheetName);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [lastLoadedUrl, loadSheet, rangeEnd, rangeStart, selectedSheetName, sheetUrl]);

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
      setErrorMessage("Vui long chon truong/trung tam truoc khi tao tai khoan hoc sinh.");
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
      setErrorMessage(error instanceof Error ? error.message : "Khong the tao tai khoan hoc sinh tu BE.");
    } finally {
      setIsSubmitting(false);
    }
  }, [centerId, classId, visibleStudents]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DashboardSectionCard
        title="Nhập học sinh từ Google Sheet"
        description="Dán link sheet, chọn lớp hoặc vùng dữ liệu cần lấy, chỉnh preview trước khi gửi BE tạo tài khoản."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Link Google Sheet</span>
            <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_150px]">
              <Input
                value={sheetUrl}
                onChange={(event) => setSheetUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void loadSheet(sheetUrl);
                  }
                }}
                placeholder="Dán link Google Sheet tại đây..."
              />
              <Button onClick={() => void loadSheet(sheetUrl)} disabled={isLoading}>
                {isLoading ? "Đang đọc..." : "Lấy dữ liệu"}
              </Button>
            </div>
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">Nơi tạo tài khoản</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Chọn trung tâm/trường và lớp đích trước khi gửi BE. Nếu bỏ trống lớp, BE sẽ tạo theo lớp trong từng dòng import.
                </p>
              </div>
              <Badge tone="secondary">Dữ liệu thật từ BE</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Trung tâm / trường</span>
                <select
                  className={`${inputClassName} mt-2`}
                  value={targetCenterId}
                  onChange={(event) => {
                    setTargetCenterId(event.target.value);
                    setTargetClassId("");
                  }}
                  disabled={managementScope.level !== "global" && centers.length <= 1}
                >
                  <option value="">Chọn trung tâm hoặc trường</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Lớp đích</span>
                <select
                  className={`${inputClassName} mt-2`}
                  value={targetClassId}
                  onChange={(event) => setTargetClassId(event.target.value)}
                  disabled={managementScope.level === "class"}
                >
                  <option value="">Tự nhận theo cột lớp</option>
                  {targetClasses.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.className}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">Vùng lấy dữ liệu</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Chọn tab lớp ở dưới cùng của Google Sheet, sau đó giới hạn cột/dòng nếu sheet có dữ liệu thừa.
                </p>
              </div>
              <Badge tone="secondary">{selectedSheetLabel}</Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(240px,1.4fr)_repeat(2,minmax(0,1fr))]">
              <label className="block md:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tab lớp trong Sheet</span>
                <select
                  className={`${inputClassName} mt-2`}
                  value={selectedSheetName}
                  onChange={(event) => {
                    const nextSheetName = event.target.value;
                    setSelectedSheetName(nextSheetName);
                    void loadSheet(sheetUrl, nextSheetName);
                  }}
                >
                  <option value="">Theo gid trong link</option>
                  {sheetTabs.map((tab) => (
                    <option key={tab.name} value={tab.name}>
                      {tab.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ô bắt đầu</span>
                <Input className="mt-2 uppercase" value={rangeStart} onChange={(event) => setRangeStart(event.target.value.toUpperCase())} placeholder="A1" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ô kết thúc</span>
                <Input className="mt-2 uppercase" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value.toUpperCase())} placeholder="Z46" />
              </label>
            </div>

            {sheetTabs.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sheetTabs.slice(0, 18).map((tab) => (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => {
                      setSelectedSheetName(tab.name);
                      void loadSheet(sheetUrl, tab.name);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedSheetName === tab.name
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
                {sheetTabs.length > 18 ? (
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                    +{sheetTabs.length - 18} tab khác trong dropdown
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <DashboardMetricCard label="Học sinh sẽ nhập" value={String(visibleStudents.length)} detail={summaryText} tone="blue" />
            <DashboardMetricCard label="Hợp lệ" value={String(validCount)} detail="Có đủ họ tên và lớp để tạo tài khoản" tone="emerald" />
            <DashboardMetricCard label="Cần kiểm tra" value={String(warningCount)} detail="Thiếu họ tên, lớp hoặc dữ liệu quan trọng" tone="amber" />
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard title="Ghi ngược về Sheet" description="FE chỉ gửi yêu cầu. BE giữ quyền Google và cập nhật username/password sau khi tạo tài khoản.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cột username</span>
              <Input className="mt-2 uppercase" value={usernameColumn} onChange={(event) => setUsernameColumn(event.target.value.toUpperCase())} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cột mật khẩu</span>
              <Input className="mt-2 uppercase" value={passwordColumn} onChange={(event) => setPasswordColumn(event.target.value.toUpperCase())} />
            </label>
          </div>

          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <RuleLine label="Đọc tab" value="Theo gid trong link hoặc BE liệt kê tab" />
            <RuleLine label="Tạo tài khoản" value="BE tạo auth user thật, chống trùng username" />
            <RuleLine label="Mật khẩu mặc định" value="123456" />
            <RuleLine label="Ghi Sheet" value={`${usernameColumn || "AA"} / ${passwordColumn || "AB"}`} />
            <RuleLine label="Quyền ghi" value="OAuth hoặc service account" />
          </div>

          {submitResult ? (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              <p className="font-semibold">
                BE đã tạo {submitResult.created} tài khoản, bỏ qua {submitResult.skipped}, trùng {submitResult.duplicates}.
              </p>
              {submitResult.credentials.length ? (
                <div className="rounded-xl bg-white/70 p-3 text-emerald-900">
                  <p className="font-semibold">Credential vừa tạo</p>
                  <div className="mt-2 grid gap-1">
                    {submitResult.credentials.slice(0, 5).map((item) => (
                      <span key={item.rowId} className="font-mono text-xs">
                        Dòng {item.rowNumber}: {item.username} / {item.password}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {submitResult.failedItems.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="font-semibold">Dòng chưa tạo được</p>
                  <div className="mt-2 grid gap-1">
                    {submitResult.failedItems.slice(0, 5).map((item) => (
                      <span key={item.id} className="text-xs">
                        {item.id}: {item.message}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <Button className="w-full" onClick={() => void submitAccounts()} disabled={!visibleStudents.length || !centerId || isSubmitting}>
            {isSubmitting ? "Đang gửi BE..." : `Gửi BE tạo ${visibleStudents.length} tài khoản`}
          </Button>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        className="xl:col-span-2"
        title="Preview trước khi tạo"
        description="Admin có thể sửa nhanh họ tên, lớp, ngày sinh, số điện thoại, username hoặc bỏ dòng dư thừa trước khi gửi BE."
        action={
          excludedCount > 0 ? (
            <Button variant="outline" size="sm" onClick={restoreAllStudents}>
              <RefreshCw className="h-4 w-4" />
              Khôi phục {excludedCount} dòng
            </Button>
          ) : null
        }
      >
        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
              <Table2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-950">Danh sách sẽ tạo tài khoản</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Tab {selectedSheetLabel} · {visibleStudents.length} dòng đang hiển thị · {excludedCount} dòng đã bỏ.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <Users className="h-4 w-4 text-blue-600" />
            {validCount}/{visibleStudents.length} dòng hợp lệ
          </div>
        </div>

        <div className="max-h-[720px] overflow-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="sticky top-0 z-10 hidden min-w-[1380px] grid-cols-[72px_minmax(300px,1.4fr)_120px_140px_140px_minmax(190px,0.8fr)_minmax(160px,0.7fr)_128px_88px] gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 backdrop-blur lg:grid">
            <span>Dòng</span>
            <span>Học sinh</span>
            <span>Lớp</span>
            <span>Ngày sinh</span>
            <span>Số SĐT</span>
            <span>Username</span>
            <span>Mật khẩu</span>
            <span>Trạng thái</span>
            <span></span>
          </div>

          <div className="min-w-[1380px] divide-y divide-slate-100 bg-white">
            {visibleStudents.map((student) => (
              <article
                key={student.id}
                className="grid gap-3 px-4 py-3 transition hover:bg-blue-50/40 lg:grid-cols-[72px_minmax(300px,1.4fr)_120px_140px_140px_minmax(190px,0.8fr)_minmax(160px,0.7fr)_128px_88px] lg:items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                    {student.rowNumber || student.sourceIndex}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {getInitials(student.fullName)}
                  </span>
                  <EditableField
                    label="Học sinh"
                    value={student.fullName}
                    onChange={(value) => updateStudent(student.id, "fullName", value)}
                    helper={student.schoolName || "Chưa xác định trường"}
                  />
                </div>
                <EditableField label="Lớp" value={student.className} onChange={(value) => updateStudent(student.id, "className", value)} />
                <EditableField label="Ngày sinh" value={student.birthday} onChange={(value) => updateStudent(student.id, "birthday", value)} />
                <EditableField label="Số SĐT" value={student.phone} onChange={(value) => updateStudent(student.id, "phone", value)} />
                <EditableField label="Username" value={student.generatedUsername} onChange={(value) => updateStudent(student.id, "generatedUsername", value)} />
                <EditableField label="Mật khẩu" value={student.generatedPassword} onChange={(value) => updateStudent(student.id, "generatedPassword", value)} />
                <Badge tone={student.status === "valid" ? "success" : "warning"}>{student.note}</Badge>
                <Button variant="ghost" size="sm" onClick={() => excludeStudent(student.id)} aria-label={`Bỏ ${student.fullName}`}>
                  <Trash2 className="h-4 w-4" />
                  Bỏ
                </Button>
              </article>
            ))}

            {result && visibleStudents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Không còn học sinh nào trong lớp hoặc vùng dữ liệu đang chọn.
              </div>
            ) : null}

            {!result && !isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Dán link Google Sheet để hệ thống tự tải dữ liệu xuống preview.
              </div>
            ) : null}
          </div>
        </div>
      </DashboardSectionCard>
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
      reject(new Error("Google Sheet phản hồi quá lâu. Kiểm tra lại quyền chia sẻ hoặc link sheet."));
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
      reject(new Error("Không tải được Google Sheet. Sheet cần bật quyền xem bằng link."));
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

function EditableField({
  label,
  value,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-slate-500 lg:hidden">{label}</span>
      <Input className="h-9 rounded-lg px-3 shadow-none" value={value} onChange={(event) => onChange(event.target.value)} />
      {helper ? <span className="mt-1 block truncate text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function RuleLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-950">{label}</span>
      <span className="text-right text-slate-500">{value}</span>
    </div>
  );
}
