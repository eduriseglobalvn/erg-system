import { useRef } from "react";

import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgTable } from "@/components/erg-mui/erg-table";
import type { ClassroomStudent } from "@/domain/school/classroom-types";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, TABLE_VISIBLE_ROWS } from "./class-students-workspace.constants";
import type { StudentCopy } from "./class-students-workspace.copy";
import { getStatusTone } from "./class-students-workspace.utils";

export function SelectControl({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <ErgSelect
      size="small"
      options={options}
      slotProps={{ htmlInput: { "aria-label": ariaLabel } }}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

export function SelectionBar({
  allVisibleSelected,
  assignDisabled = false,
  assignDisabledReason,
  copy,
  onAssign,
  onClear,
  onToggleAll,
  selectedCount,
  visibleCount,
}: {
  allVisibleSelected: boolean;
  assignDisabled?: boolean;
  assignDisabledReason?: string;
  copy: StudentCopy;
  onAssign: () => void;
  onClear: () => void;
  onToggleAll: () => void;
  selectedCount: number;
  visibleCount: number;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" }, bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, justifyContent: { sm: "space-between" }, mt: 2, p: 1.5 }}
    >
      <Typography variant="body2" color="text.secondary">
        <Box component="span" sx={{ color: "text.primary", fontWeight: "fontWeightBold" }}>{copy.selectionSummary(selectedCount)}</Box>
        <Box component="span" sx={{ ml: 0.5 }}>{copy.visibleSummary(visibleCount)}</Box>
      </Typography>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button size="small" variant="contained" onClick={onAssign} disabled={selectedCount === 0 || assignDisabled} title={assignDisabled ? assignDisabledReason : undefined}>
          {copy.openAssignDialog(selectedCount)}
        </Button>
        <Button size="small" variant="outlined" onClick={onToggleAll} disabled={visibleCount === 0}>
          {allVisibleSelected ? copy.unselectVisible : copy.selectVisible}
        </Button>
        <Button size="small" variant="text" onClick={onClear} disabled={selectedCount === 0}>
          {copy.clearSelection}
        </Button>
      </Stack>
    </Stack>
  );
}

export function StudentDataTable({
  copy,
  focusedStudentId,
  onFocusStudent,
  onToggleStudent,
  selectedIds,
  students,
}: {
  copy: StudentCopy;
  focusedStudentId: string | null;
  onFocusStudent: (studentId: string) => void;
  onToggleStudent: (studentId: string) => void;
  selectedIds: string[];
  students: ClassroomStudent[];
}) {
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualList({
    count: students.length,
    estimateSize: TABLE_ROW_HEIGHT,
    overscan: 8,
    scrollRef: tableScrollRef,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const bottomPadding = Math.max(0, rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0));

  if (students.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <ErgEmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      </Box>
    );
  }

  return (
    <>
      <Box
        ref={tableScrollRef}
        sx={{ border: 1, borderColor: "divider", borderRadius: 1, display: { xs: "none", md: "block" }, maxHeight: TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * TABLE_VISIBLE_ROWS, mt: 2, overflow: "auto" }}
      >
        <ErgTable sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }}>{copy.pickColumn}</TableCell>
              <TableCell>{copy.studentColumn}</TableCell>
              <TableCell>{copy.assignmentColumn}</TableCell>
              <TableCell>{copy.progressColumn}</TableCell>
              <TableCell>{copy.scoreColumn}</TableCell>
              <TableCell>{copy.statusColumn}</TableCell>
              <TableCell>{copy.actionColumn}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topPadding > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell colSpan={7} sx={{ height: topPadding, p: 0 }} />
              </TableRow>
            ) : null}
            {virtualRows.map((virtualRow) => {
              const student = students[virtualRow.index];
              if (!student) return null;

              return (
                <StudentTableRow
                  key={student.id}
                  active={focusedStudentId === student.id}
                  checked={selectedIds.includes(student.id)}
                  copy={copy}
                  onFocus={() => onFocusStudent(student.id)}
                  onToggle={() => onToggleStudent(student.id)}
                  student={student}
                />
              );
            })}
            {bottomPadding > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell colSpan={7} sx={{ height: bottomPadding, p: 0 }} />
              </TableRow>
            ) : null}
          </TableBody>
        </ErgTable>
      </Box>

      <Box sx={{ display: { xs: "grid", md: "none" }, gap: 1.5, mt: 2 }}>
        {students.map((student) => (
          <StudentMobileCard
            key={student.id}
            active={focusedStudentId === student.id}
            checked={selectedIds.includes(student.id)}
            copy={copy}
            onFocus={() => onFocusStudent(student.id)}
            onToggle={() => onToggleStudent(student.id)}
            student={student}
          />
        ))}
      </Box>
    </>
  );
}

function StudentAvatar({ seed, size }: { seed: string; size: number }) {
  return (
    <Box
      component="span"
      sx={{ bgcolor: "primary.main", borderRadius: 1, color: "primary.contrastText", display: "grid", flexShrink: 0, fontWeight: "fontWeightBold", height: size, placeItems: "center", typography: "caption", width: size }}
    >
      {seed}
    </Box>
  );
}

function StudentNameButton({ name, noWrap = false, onClick }: { name: string; noWrap?: boolean; onClick: () => void }) {
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      color="text.primary"
      onClick={onClick}
      sx={{ display: "block", fontWeight: "fontWeightBold", maxWidth: "100%", textAlign: "left", typography: "body2", ...(noWrap ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : null), "&:hover": { color: "primary.main" } }}
    >
      {name}
    </Link>
  );
}

function StudentTableRow({
  active,
  checked,
  copy,
  onFocus,
  onToggle,
  student,
}: {
  active: boolean;
  checked: boolean;
  copy: StudentCopy;
  onFocus: () => void;
  onToggle: () => void;
  student: ClassroomStudent;
}) {
  return (
    <TableRow hover={!active} selected={active}>
      <TableCell>
        <Checkbox
          size="small"
          sx={{ p: 0 }}
          slotProps={{ input: { "aria-label": copy.selectStudent(student.name) } }}
          checked={checked}
          onChange={onToggle}
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <StudentAvatar seed={student.avatarSeed} size={36} />
          <Box sx={{ minWidth: 0 }}>
            <StudentNameButton name={student.name} noWrap onClick={onFocus} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.5 }}>
              {student.className} • {student.lastActivity}
            </Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ maxWidth: 260 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightMedium" }}>{student.currentAssignment}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.5 }}>{student.currentStage}</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1, minWidth: 120, typography: "caption", fontWeight: "fontWeightBold" }}>
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={student.progressRate}
          sx={{ height: 8, borderRadius: 1, bgcolor: "grey.100" }}
        />
      </TableCell>
      <TableCell sx={{ fontWeight: "fontWeightBold" }}>
        {student.averageScore}{" "}
        <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: "fontWeightBold" }}>{copy.scoreUnit}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={copy.status[student.status]} size="small" color={getStatusTone(student.status)} />
      </TableCell>
      <TableCell>
        <Button size="small" variant="outlined" onClick={onFocus}>
          {copy.viewDetail}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function StudentMobileCard({
  active,
  checked,
  copy,
  onFocus,
  onToggle,
  student,
}: {
  active: boolean;
  checked: boolean;
  copy: StudentCopy;
  onFocus: () => void;
  onToggle: () => void;
  student: ClassroomStudent;
}) {
  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{ borderColor: active ? "primary.main" : "divider", borderRadius: 1, boxShadow: active ? 2 : "none", p: 2 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Checkbox
          size="small"
          aria-label={copy.selectStudent(student.name)}
          checked={checked}
          sx={{ mt: 0.5, p: 0.5 }}
          onChange={onToggle}
        />
        <StudentAvatar seed={student.avatarSeed} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StudentNameButton name={student.name} onClick={onFocus} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {student.className} • {student.lastActivity}
          </Typography>
        </Box>
        <Chip label={copy.status[student.status]} size="small" color={getStatusTone(student.status)} />
      </Stack>
      <Box sx={{ bgcolor: "background.default", borderRadius: 1, mt: 2, p: 1.5 }}>
        <Typography variant="subtitle2">{student.currentAssignment}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{student.currentStage}</Typography>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mt: 1.5, typography: "subtitle2" }}>
          <span>{copy.progressLabel}</span>
          <span>{student.progressRate}%</span>
        </Stack>
        <LinearProgress variant="determinate" value={student.progressRate} sx={{ mt: 1, height: 8, borderRadius: 1 }} />
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mt: 1.5 }}>
        <Typography variant="subtitle2" component="span">
          {student.averageScore} {copy.scoreUnit}
        </Typography>
        <Button size="small" variant="outlined" onClick={onFocus}>
          {copy.viewDetail}
        </Button>
      </Stack>
    </Paper>
  );
}

export function StudentDetailCard({ copy, student }: { copy: StudentCopy; student: ClassroomStudent }) {
  return (
    <DashboardSectionCard title={copy.studentPanelTitle} description={copy.studentPanelDescription}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            sx={{ bgcolor: "primary.main", borderRadius: 1, color: "primary.contrastText", display: "grid", height: 48, placeItems: "center", typography: "h5", width: 48 }}
          >
            {student.avatarSeed}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" noWrap>{student.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {student.className} • {student.schoolName}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Metric label={copy.progressLabel} value={`${student.progressRate}%`} />
          <Metric label={copy.scoreLabel} value={`${student.averageScore}`} />
          <Metric label={copy.streakLabel} value={`${student.streakDays}`} />
          <Metric label={copy.completedLabel} value={`${student.completedAssignments}`} />
        </Box>

        <InfoBlock title={copy.currentAssignmentTitle} body={`${student.currentAssignment} - ${student.currentStage}`} />
        <InfoBlock title={copy.mentorNoteTitle} body={student.mentorNote} />
      </Stack>
    </DashboardSectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "background.default", borderRadius: 1, px: 1.5, py: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{label}</Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>{body}</Typography>
    </Paper>
  );
}
