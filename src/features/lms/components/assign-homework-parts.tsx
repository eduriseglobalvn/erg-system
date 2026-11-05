import { memo } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import LmsCheckbox from "@mui/material/Checkbox";
import Skeleton from "@mui/material/Skeleton";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTable } from "@/components/erg-mui/erg-table";
import {
  type AssignHomeworkGroupOption,
} from "@/features/lms/components/assign-homework-student-utils";
import type { AssignmentCatalogItem } from "@/features/lms/classroom/components/class-students-workspace.types";
import type { ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";

export type AssignmentGroupItem = AssignHomeworkGroupOption;

// Sticky cells must stay opaque, so the selection/hover tint is layered over the paper colour.
const tint = (color: string) => `linear-gradient(${color}, ${color})`;

const selectableCardSx = (checked: boolean) => ({
  border: 1,
  borderColor: checked ? "primary.main" : "divider",
  borderRadius: 2,
  bgcolor: checked ? "info.light" : "background.paper",
  boxShadow: 1,
});

export function AssignmentCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <Box
      component="span"
      sx={{ mx: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      onClick={(event) => event.stopPropagation()}
    >
      <LmsCheckbox
        checked={checked}
        onChange={() => onChange()}
        size="small"
        slotProps={{ input: { "aria-label": label } }}
        sx={{ p: 0, color: "primary.main", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "primary.main" } }}
      />
    </Box>
  );
}

function StudentProgressCell({ value, available = true }: { value: number; available?: boolean }) {
  if (!available) return <Typography component="span" variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>—</Typography>;
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography component="div" variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>{value}%</Typography>
      <Box sx={{ mt: 0.5, height: 6, overflow: "hidden", borderRadius: 1, bgcolor: "action.hover" }}>
        <Box sx={{ height: "100%", borderRadius: 1, bgcolor: "primary.main", width: `${Math.min(100, Math.max(0, value))}%` }} />
      </Box>
    </Box>
  );
}

const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => i);

const cellSx = { borderRight: 1, borderColor: "divider" } as const;
const stickyCol = (left: number) => ({ ...cellSx, position: "sticky", left, zIndex: 2 }) as const;
const headStickyCol = (left: number) => ({ ...cellSx, position: "sticky", left, top: 0, zIndex: 4 }) as const;

function StudentSelectionSkeletonRow({ index }: { index: number }) {
  return (
    <TableRow sx={{ "& td": { bgcolor: "background.paper" } }}>
      <TableCell align="center" sx={stickyCol(0)}>
        <Skeleton variant="rounded" width={18} height={18} sx={{ mx: "auto", borderRadius: 0.5 }} />
      </TableCell>
      <TableCell align="center" sx={stickyCol(48)}>
        <Skeleton variant="text" width={20} height={18} sx={{ mx: "auto" }} />
      </TableCell>
      <TableCell sx={stickyCol(104)}>
        <Skeleton variant="text" width={110 + (index % 4) * 20} height={18} />
      </TableCell>
      <TableCell sx={cellSx}><Skeleton variant="text" width={40} height={18} /></TableCell>
      <TableCell sx={cellSx}><Skeleton variant="text" width={140} height={18} /></TableCell>
      <TableCell sx={cellSx}><Skeleton variant="rounded" width={120} height={10} sx={{ borderRadius: 0.5 }} /></TableCell>
      <TableCell sx={cellSx}><Skeleton variant="text" width={85} height={18} /></TableCell>
    </TableRow>
  );
}

export const StudentSelectionTableRow = memo(function StudentSelectionTableRow({
  student,
  index,
  isChecked,
  onToggleStudent,
}: {
  student: ClassroomStudent;
  index: number;
  isChecked: boolean;
  onToggleStudent: (studentId: string) => void;
}) {
  return (
    <TableRow
      onClick={() => onToggleStudent(student.id)}
      sx={(theme) => ({
        cursor: "pointer",
        userSelect: "none",
        "& td": {
          bgcolor: "background.paper",
          backgroundImage: isChecked ? tint(theme.palette.info.light) : "none",
          transition: "background-color 100ms",
        },
        "&:hover td": {
          bgcolor: "background.paper",
          backgroundImage: tint(isChecked ? theme.palette.info.light : theme.palette.action.hover),
        },
      })}
    >
      <TableCell align="center" sx={stickyCol(0)}>
        <AssignmentCheckbox checked={isChecked} onChange={() => onToggleStudent(student.id)} label={`Chọn ${student.name}`} />
      </TableCell>
      <TableCell align="center" sx={{ ...stickyCol(48), color: "text.secondary", fontWeight: "fontWeightMedium" }}>
        {index + 1}
      </TableCell>
      <TableCell sx={{ ...stickyCol(104), color: "primary.main", fontWeight: "fontWeightBold", "&:hover": { textDecoration: "underline" } }}>
        {student.name}
      </TableCell>
      <TableCell sx={{ ...cellSx, fontWeight: "fontWeightMedium" }}>{student.className}</TableCell>
      <TableCell sx={{ ...cellSx, fontWeight: "fontWeightMedium" }}>{student.currentAssignment}</TableCell>
      <TableCell sx={cellSx}>
        <StudentProgressCell available={student.hasProgressData === true} value={student.progressRate} />
      </TableCell>
      <TableCell sx={{ ...cellSx, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{student.lastActivity}</TableCell>
    </TableRow>
  );
});

export function StudentSelectionTable({
  allSelected,
  sx,
  isLoading = false,
  onToggleAll,
  onToggleStudent,
  selectedIds,
  students,
}: {
  allSelected: boolean;
  sx?: SxProps<Theme>;
  isLoading?: boolean;
  onToggleAll: () => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: Set<string>;
  students: ClassroomStudent[];
}) {
  return (
    <Box sx={[{ minHeight: 0, flex: 1, overflow: "auto", position: "relative" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {isLoading && students.length > 0 ? (
        <LinearProgress sx={{ position: "sticky", top: 0, left: 0, zIndex: 50, height: 2 }} />
      ) : null}
      <ErgTable sx={{ minWidth: 1160, width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ ...headStickyCol(0), width: 48 }}>
              <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh" />
            </TableCell>
            <TableCell align="center" sx={{ ...headStickyCol(48), width: 56 }}>STT</TableCell>
            <TableCell sx={{ ...headStickyCol(104), width: 208 }}>Học sinh</TableCell>
            <TableCell sx={cellSx}>Lớp</TableCell>
            <TableCell sx={cellSx}>Bài hiện tại</TableCell>
            <TableCell sx={cellSx}>Tiến độ</TableCell>
            <TableCell sx={cellSx}>Hoạt động gần nhất</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ transition: "opacity 200ms", opacity: isLoading && students.length > 0 ? 0.6 : 1 }}>
          {isLoading && students.length === 0 ? (
            SKELETON_ROWS.map((idx) => <StudentSelectionSkeletonRow key={idx} index={idx} />)
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                Chưa có dữ liệu học sinh của lớp này
              </TableCell>
            </TableRow>
          ) : (
            students.map((student, index) => (
              <StudentSelectionTableRow
                key={student.id}
                student={student}
                index={index}
                isChecked={selectedIds.has(student.id)}
                onToggleStudent={onToggleStudent}
              />
            ))
          )}
        </TableBody>
      </ErgTable>
    </Box>
  );
}

export function MobileAssignProgress({
  selectedCount,
  step,
  targetType,
}: {
  selectedCount: number;
  step: number;
  targetType: "grade" | "class" | "group";
}) {
  const targetLabel = targetType === "grade" ? "Khối" : targetType === "group" ? "Nhóm" : "Lớp";
  const steps = [
    { id: 1, label: "Thiết lập" },
    { id: 2, label: "Học liệu" },
  ];

  return (
    <Box component="section" sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1, display: { md: "none" } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Typography noWrap variant="body2" sx={{ minWidth: 0, fontWeight: "fontWeightBold" }}>
          Giao bài · {targetLabel} · {selectedCount} đã chọn
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{ flexShrink: 0, borderRadius: 999, border: 1, borderColor: "primary.main", bgcolor: "info.light", px: 1.25, py: 0.5, fontWeight: "fontWeightBold", color: "primary.main" }}
        >
          Bước {step}/2
        </Typography>
      </Box>
      <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
        {steps.map((item) => (
          <Box key={item.id} sx={{ minWidth: 0 }}>
            <Box sx={{ height: 4, borderRadius: 999, bgcolor: step >= item.id ? "primary.main" : "divider" }} />
            <Typography
              noWrap
              variant="caption"
              sx={{ display: "block", mt: 0.5, fontWeight: "fontWeightBold", color: step === item.id ? "primary.main" : "text.secondary" }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function MobileStudentSelectionList({
  allSelected,
  isLoading = false,
  onToggleAll,
  onToggleStudent,
  selectedIds,
  students,
}: {
  allSelected: boolean;
  isLoading?: boolean;
  onToggleAll: () => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: Set<string>;
  students: ClassroomStudent[];
}) {
  return (
    <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", borderRadius: 2, bgcolor: "background.default", display: { md: "none" } }}>
      <ButtonBase
        onClick={onToggleAll}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "grid",
          minHeight: 44,
          width: "100%",
          gridTemplateColumns: "minmax(0, 1fr) 28px",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          px: 1.5,
          textAlign: "left",
          boxShadow: 1,
        }}
      >
        <Typography noWrap component="span" variant="caption" sx={{ minWidth: 0, fontWeight: "fontWeightBold" }}>
          {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </Typography>
        <AssignmentCheckbox checked={allSelected} onChange={onToggleAll} label="Chọn tất cả học sinh trong danh sách lọc" />
      </ButtonBase>
      <Box sx={{ display: "grid", maxHeight: 330, gap: 0.75, overflowY: "auto", p: 1 }}>
        {isLoading && students.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, borderRadius: 2, bgcolor: "background.paper", p: 1.5, boxShadow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Skeleton variant="rounded" width={18} height={18} sx={{ borderRadius: 0.5 }} />
                <Box sx={{ display: "grid", gap: 0.5 }}>
                  <Skeleton variant="text" width={120} height={16} />
                  <Skeleton variant="text" width={60} height={12} />
                </Box>
              </Box>
              <Skeleton variant="rounded" width={40} height={18} sx={{ borderRadius: 1 }} />
            </Box>
          ))
        ) : students.length === 0 ? (
          <Box sx={{ borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider", bgcolor: "background.paper", px: 2, py: 2.5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: "fontWeightBold" }}>Không có học sinh</Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              Thử chọn lại lớp hoặc xóa bộ lọc tìm kiếm.
            </Typography>
          </Box>
        ) : null}
        {students.map((student) => {
          const checked = selectedIds.has(student.id);
          return (
            <ButtonBase
              key={student.id}
              onClick={() => onToggleStudent(student.id)}
              sx={[
                selectableCardSx(checked),
                { display: "flex", minHeight: 54, alignItems: "center", justifyContent: "flex-start", gap: 1.25, px: 1.5, py: 1, textAlign: "left", "&:active": { transform: "scale(0.99)" } },
              ]}
            >
              <AssignmentCheckbox checked={checked} onChange={() => onToggleStudent(student.id)} label={`Chọn ${student.name}`} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap variant="body2" sx={{ fontWeight: "fontWeightBold" }}>{student.name}</Typography>
                <Typography noWrap variant="caption" sx={{ display: "block", mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                  {student.className}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

function MobilePreviewCard({
  checked,
  checkboxLabel,
  meta,
  name,
  onOpenPreview,
  onToggle,
}: {
  checked: boolean;
  checkboxLabel: string;
  meta: string;
  name: string;
  onOpenPreview: () => void;
  onToggle: () => void;
}) {
  return (
    <Box component="article" sx={[selectableCardSx(checked), { p: 1.5 }]}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <AssignmentCheckbox checked={checked} onChange={onToggle} label={checkboxLabel} />
        <ButtonBase onClick={onOpenPreview} sx={{ minWidth: 0, flex: 1, display: "block", textAlign: "left" }}>
          <Typography noWrap component="span" variant="body2" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{name}</Typography>
          <Typography component="span" variant="caption" sx={{ display: "block", mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
            {meta}
          </Typography>
        </ButtonBase>
        <ErgButton variant="outlined" size="small" onClick={onOpenPreview} sx={{ height: 40, flexShrink: 0 }}>
          Xem
        </ErgButton>
      </Box>
    </Box>
  );
}

export function MobileAssignmentGroupList({
  groups,
  onOpenPreview,
  onToggleGroup,
  selectedGroupIds,
  selectedStudentIdsByGroup,
}: {
  groups: AssignmentGroupItem[];
  onOpenPreview: (groupId: string) => void;
  onToggleGroup: (groupId: string) => void;
  selectedGroupIds: Set<string>;
  selectedStudentIdsByGroup: Record<string, string[]>;
}) {
  return (
    <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5, bgcolor: "background.default", p: 1.5 }}>
      {groups.map((group) => {
        const selectedCount = selectedStudentIdsByGroup[group.id]?.length ?? group.studentIds.length;
        return (
          <MobilePreviewCard
            key={group.id}
            checked={selectedGroupIds.has(group.id)}
            checkboxLabel={`Chọn nhóm ${group.name}`}
            meta={`${group.source} · ${selectedCount}/${group.studentIds.length} học sinh`}
            name={group.name}
            onOpenPreview={() => onOpenPreview(group.id)}
            onToggle={() => onToggleGroup(group.id)}
          />
        );
      })}
    </Box>
  );
}

export function MobileGradeClassList({
  classes,
  onOpenPreview,
  onToggleClass,
  selectedClassIds,
  studentIdsByClass,
  selectedStudentIdsByClass,
}: {
  classes: ClassroomSnapshot[];
  onOpenPreview: (classId: string) => void;
  onToggleClass: (classId: string) => void;
  selectedClassIds: Set<string>;
  studentIdsByClass: Record<string, string[]>;
  selectedStudentIdsByClass: Record<string, string[]>;
}) {
  return (
    <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5, bgcolor: "background.default", p: 1.5 }}>
      {classes.map((classroom) => {
        const studentIds = studentIdsByClass[classroom.id] ?? [];
        const selectedCount = selectedStudentIdsByClass[classroom.id]?.length ?? studentIds.length;
        return (
          <MobilePreviewCard
            key={classroom.id}
            checked={selectedClassIds.has(classroom.id)}
            checkboxLabel={`Chọn lớp ${classroom.className}`}
            meta={`${classroom.schoolName} · ${selectedCount}/${studentIds.length} học sinh`}
            name={classroom.className}
            onOpenPreview={() => onOpenPreview(classroom.id)}
            onToggle={() => onToggleClass(classroom.id)}
          />
        );
      })}
    </Box>
  );
}

const resourceTagSx = { borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.paper", px: 1, py: 0.25 } as const;

export function MobileAssignmentResourceList({
  onToggleResource,
  resources,
  selectedResourceIds,
}: {
  onToggleResource: (resourceId: string) => void;
  resources: AssignmentCatalogItem[];
  selectedResourceIds: Set<string>;
}) {
  return (
    <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5, bgcolor: "background.default", p: 1.5 }}>
      {resources.map((resource) => {
        const selected = selectedResourceIds.has(resource.id);
        return (
          <ButtonBase
            key={resource.id}
            onClick={() => onToggleResource(resource.id)}
            sx={[
              selectableCardSx(selected),
              { display: "block", minHeight: 76, px: 1.5, py: 1.5, textAlign: "left", "&:active": { transform: "scale(0.99)" } },
            ]}
          >
            <Box component="span" sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <AssignmentCheckbox checked={selected} onChange={() => onToggleResource(resource.id)} label={`Chọn ${resource.title}`} />
              <Typography noWrap component="span" variant="body2" sx={{ display: "block", minWidth: 0, fontWeight: "fontWeightBold" }}>
                {resource.title}
              </Typography>
            </Box>
            <Typography component="span" variant="caption" sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.75, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              <Box component="span" sx={resourceTagSx}>{resource.levelLabel}</Box>
              <Box component="span" sx={resourceTagSx}>{resource.topicLabel}</Box>
              <Box component="span" sx={resourceTagSx}>{resource.durationLabel}</Box>
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
