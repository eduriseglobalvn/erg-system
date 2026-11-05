import type { ComponentType } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { LmsStudentGroup, LmsStudentGroupInput } from "@/features/lms/api/lms-assignment-command-api";
import type { ClassroomStudent } from "@/domain/school/classroom-types";

export type StudentGroup = {
  id: string;
  name: string;
  note: string;
  color: string;
  studentIds: string[];
  serverBacked?: boolean;
};

// Persisted group colors (sent to the API as data), not styling tokens.
export const groupColorOptions = [
  { label: "Xanh dương", value: "var(--erg-blue)" },
  { label: "Xanh biển", value: "#0ea5e9" },
  { label: "Chàm", value: "var(--erg-blue)" },
  { label: "Xanh lá", value: "#10b981" },
  { label: "Ngọc", value: "#14b8a6" },
  { label: "Lục", value: "#22c55e" },
  { label: "Cam", value: "#f97316" },
  { label: "Đỏ cam", value: "#ef4444" },
  { label: "Đỏ hồng", value: "#f43f5e" },
  { label: "Tím", value: "#8b5cf6" },
  { label: "Tím đậm", value: "#7c3aed" },
  { label: "Hồng", value: "#ec4899" },
  { label: "Hồng sen", value: "#d946ef" },
  { label: "Vàng", value: "#eab308" },
  { label: "Hổ phách", value: "#f59e0b" },
  { label: "Nâu", value: "#a16207" },
  { label: "Xám xanh", value: "#64748b" },
  { label: "Than", value: "#334155" },
];

/** Turns a GraphQL scope error into Vietnamese copy; returns null when there is no error. */
export function resolveStudentGroupsError(error: unknown): string | null {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  if (/class scope is not allowed/i.test(message)) {
    return "Bạn chưa được phân quyền quản lý nhóm học sinh cho lớp này. Hãy chọn lớp bạn phụ trách hoặc liên hệ quản trị viên.";
  }
  return "Không tải được dữ liệu nhóm học sinh. Vui lòng thử lại sau.";
}

export function GroupColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <Box sx={{ mb: 1.5, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", px: 1.5, py: 1.25 }}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 1, alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Màu nhóm</Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: value }} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Hiển thị ở danh sách nhóm</Typography>
        </Stack>
      </Stack>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {groupColorOptions.map((option) => {
          const selected = option.value === value;
          return (
            <ButtonBase
              key={option.value}
              aria-label={`Chọn màu ${option.label}`}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: 1,
                borderColor: selected ? "text.primary" : "divider",
                bgcolor: "background.paper",
                boxShadow: selected ? 1 : 0,
                transition: "border-color 0.15s ease",
                "&:hover": selected ? undefined : { borderColor: "text.secondary" },
              }}
            >
              <Box component="span" sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: option.value }} />
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

export function toStudentGroupPayload(group: StudentGroup, selectedClassId?: string): LmsStudentGroupInput {
  return {
    classId: selectedClassId ?? null,
    color: group.color,
    name: group.name,
    note: group.note,
    studentIds: group.studentIds,
  };
}

export function toUiStudentGroup(group: LmsStudentGroup, existing: StudentGroup | undefined, index: number): StudentGroup {
  return {
    color: group.color ?? existing?.color ?? groupColorOptions[index % groupColorOptions.length].value,
    id: group.id,
    name: group.name,
    note: group.note ?? existing?.note ?? "",
    serverBacked: true,
    studentIds: group.studentIds,
  };
}

export function notifyStudentGroupSyncError(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể đồng bộ nhóm học sinh với máy chủ.";
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function StudentGroupStat({ icon: Icon, label, value }: { icon: ComponentType<SvgIconProps>; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", px: 1.25, py: 0.75 }}>
      <Box sx={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: 0.75, bgcolor: "background.paper", color: "primary.main", boxShadow: 1 }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}>{label}</Typography>
        <Typography variant="body2" noWrap sx={{ color: "text.primary", fontWeight: "fontWeightMedium" }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

const headCellSx = { typography: "body2", color: "text.secondary", fontWeight: "fontWeightMedium" } as const;
const bodyCellSx = { typography: "body2", color: "text.primary" } as const;

export function StudentSelectionTable({
  students,
  emptyLabel,
  getChecked,
  onCheckedChange,
  headerCheckbox,
  mode,
}: {
  students: ClassroomStudent[];
  emptyLabel: string;
  getChecked: (student: ClassroomStudent) => boolean;
  onCheckedChange: (student: ClassroomStudent, checked: boolean) => void;
  headerCheckbox: {
    ariaLabel: string;
    checked: boolean | "indeterminate";
    onCheckedChange: (checked: boolean | "indeterminate") => void;
  };
  mode: "members" | "available";
}) {
  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column", overflow: "hidden", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", boxShadow: 1 }}>
      <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: { xs: "block", lg: "none" }, "& > li + li": { borderTop: 1, borderColor: "divider" } }}>
          <li>
            <Box component="label" sx={{ display: "flex", minHeight: 44, cursor: "pointer", alignItems: "center", gap: 1.5, bgcolor: "action.hover", px: 1.5 }}>
              <Checkbox
                slotProps={{ input: { "aria-label": headerCheckbox.ariaLabel } }}
                checked={headerCheckbox.checked === true}
                indeterminate={headerCheckbox.checked === "indeterminate"}
                onChange={(event) => headerCheckbox.onCheckedChange(event.target.checked)}
                size="small"
                sx={{ p: 0 }}
              />
              <Typography component="span" variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Chọn tất cả</Typography>
            </Box>
          </li>
          {students.length > 0 ? (
            students.map((student) => {
              const checked = getChecked(student);
              return (
                <li key={student.id}>
                  <Box component="label" sx={{ display: "flex", minHeight: 56, cursor: "pointer", alignItems: "center", gap: 1.5, px: 1.5, py: 1 }}>
                    <Checkbox
                      slotProps={{ input: { "aria-label": `${checked ? "Bỏ chọn" : "Chọn"} ${student.name}` } }}
                      checked={checked}
                      onChange={(event) => onCheckedChange(student, event.target.checked)}
                      size="small"
                      sx={{ p: 0 }}
                    />
                    <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
                      <Typography component="span" variant="body2" noWrap sx={{ display: "block", fontWeight: "fontWeightMedium" }}>{student.name}</Typography>
                      <Typography component="span" variant="body2" noWrap sx={{ display: "block", color: "text.secondary" }}>{student.className} · {student.gradeLabel}</Typography>
                    </Box>
                    <StudentStatusBadge status={student.status} selected={mode === "available" && checked} />
                  </Box>
                </li>
              );
            })
          ) : (
            <Box component="li" sx={{ p: 3, textAlign: "center", typography: "body2", color: "text.secondary", fontWeight: "fontWeightMedium" }}>{emptyLabel}</Box>
          )}
        </Box>
        <Table size="small" stickyHeader sx={{ display: { xs: "none", lg: "table" } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 44, px: 1.5 }}>
                <Checkbox
                  slotProps={{ input: { "aria-label": headerCheckbox.ariaLabel } }}
                  checked={headerCheckbox.checked === true}
                  indeterminate={headerCheckbox.checked === "indeterminate"}
                  onChange={(event) => headerCheckbox.onCheckedChange(event.target.checked)}
                  size="small"
                  sx={{ p: 0 }}
                />
              </TableCell>
              <TableCell sx={{ ...headCellSx, minWidth: 220 }}>Học sinh</TableCell>
              <TableCell sx={{ ...headCellSx, minWidth: 120 }}>Lớp</TableCell>
              <TableCell sx={{ ...headCellSx, minWidth: 110 }}>Khối</TableCell>
              <TableCell sx={{ ...headCellSx, minWidth: 150 }}>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => {
                const checked = getChecked(student);
                return (
                  <TableRow key={student.id} selected={checked} data-state={checked ? "selected" : undefined}>
                    <TableCell sx={{ px: 1.5 }}>
                      <Checkbox
                        slotProps={{ input: { "aria-label": `${checked ? "Bỏ chọn" : "Chọn"} ${student.name}` } }}
                        checked={checked}
                        onChange={(event) => onCheckedChange(student, event.target.checked)}
                        size="small"
                        sx={{ p: 0 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Box sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightMedium" }}>{student.name}</Typography>
                        <Typography variant="body2" noWrap sx={{ mt: 0.25, color: "text.secondary" }}>{student.currentStage}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, minWidth: 120 }}>{student.className}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, minWidth: 110 }}>{student.gradeLabel}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <StudentStatusBadge status={student.status} selected={mode === "available" && checked} />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ height: 160, textAlign: "center", typography: "body2", color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      <Typography variant="body2" sx={{ borderTop: 1, borderColor: "divider", px: 1.5, py: 1, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
        {students.length} học sinh{mode === "available" ? " trong danh sách" : " trong nhóm"}
      </Typography>
    </Box>
  );
}

function StudentStatusBadge({ status, selected }: { status: ClassroomStudent["status"]; selected: boolean }) {
  const statusCopy = {
    ahead: "Vượt tiến độ",
    steady: "Ổn định",
    support: "Cần hỗ trợ",
  } satisfies Record<ClassroomStudent["status"], string>;
  const tone = selected ? "info" : status === "support" ? "warning" : status === "ahead" ? "success" : "neutral";

  return <ErgStatusChip dot={false} tone={tone} label={selected ? "Đã chọn" : statusCopy[status]} sx={{ flexShrink: 0 }} />;
}
