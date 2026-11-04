import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
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
} from "@/features/lcms/imports/google-sheets-csv-adapter";
import { SheetRangeCard } from "@/features/lcms/admin-operations/components/student-sheet-import/sheet-range-card";
import { SheetUrlCard } from "@/features/lcms/admin-operations/components/student-sheet-import/sheet-url-card";
import { StudentPreviewCard } from "@/features/lcms/admin-operations/components/student-sheet-import/student-preview-card";
import {
  parseBirthdayForApi,
  parseCellRange,
  parseStudentSheet,
  type EditableStudentField,
  type ParsedSheetResult,
  type ParsedStudentRow,
} from "@/features/lcms/admin-operations/components/student-sheet-import/student-sheet-parser";
import { SubmitSidebarCard } from "@/features/lcms/admin-operations/components/student-sheet-import/submit-sidebar-card";
import { TargetUnitCard } from "@/features/lcms/admin-operations/components/student-sheet-import/target-unit-card";

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
    (studentId: string, field: EditableStudentField, value: string) => {
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
            <SheetUrlCard isLoading={isLoading} loadSheet={loadSheet} setSheetUrl={setSheetUrl} sheetUrl={sheetUrl} />

            <TargetUnitCard
              centerOptions={centerOptions}
              centers={centers}
              lockedCenter={lockedCenter}
              managementScope={managementScope}
              setTargetCenterId={setTargetCenterId}
              setTargetClassId={setTargetClassId}
              targetCenterId={targetCenterId}
              targetClassId={targetClassId}
              targetClasses={targetClasses}
            />

            <SheetRangeCard
              loadSheet={loadSheet}
              rangeEnd={rangeEnd}
              rangeStart={rangeStart}
              selectedSheetLabel={selectedSheetLabel}
              selectedSheetName={selectedSheetName}
              setRangeEnd={setRangeEnd}
              setRangeStart={setRangeStart}
              setSelectedSheetName={setSelectedSheetName}
              sheetTabs={sheetTabs}
              sheetUrl={sheetUrl}
            />

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
        <StudentPreviewCard
          excludeStudent={excludeStudent}
          excludedCount={excludedCount}
          isLoading={isLoading}
          restoreAllStudents={restoreAllStudents}
          result={result}
          updateStudent={updateStudent}
          visibleStudents={visibleStudents}
        />
      </Stack>

      {/* Right Sidebar Control */}
      <Box sx={compact ? { display: { xl: "grid" }, gridTemplateColumns: { xl: "minmax(0, 1fr) 320px" }, alignItems: { xl: "start" }, gap: 2 } : undefined}>
        <SubmitSidebarCard
          centerId={centerId}
          isSubmitting={isSubmitting}
          passwordColumn={passwordColumn}
          selectedSheetLabel={selectedSheetLabel}
          setPasswordColumn={setPasswordColumn}
          setUsernameColumn={setUsernameColumn}
          submitAccounts={submitAccounts}
          submitResult={submitResult}
          usernameColumn={usernameColumn}
          visibleStudents={visibleStudents}
        />
      </Box>
    </Box>
  );
}
