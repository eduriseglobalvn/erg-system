import { useId, type ReactNode } from "react";

import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import type { StudentCopy } from "./class-students-workspace.copy";
import type { AssignmentCatalogItem, AssignmentLevel, AssignmentSubject, AssignmentTopic } from "./class-students-workspace.types";
import { formatSelectedStudentNames } from "./class-students-workspace.utils";

const pickerButtonSx = (selected: boolean): SxProps<Theme> => ({
  bgcolor: selected ? "action.selected" : "background.paper",
  border: 1,
  borderColor: selected ? "primary.main" : "divider",
  borderRadius: 1,
  display: "block",
  p: 1.5,
  textAlign: "left",
  transition: "background-color 0.15s ease",
  width: "100%",
  "&:hover": { bgcolor: selected ? "action.selected" : "action.hover" },
  "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 2 },
});

const metaPillSx: SxProps<Theme> = { bgcolor: "action.hover", borderRadius: 1, px: 1, py: 0.5 };

export function AssignmentDialog({
  assignments,
  canDeliver,
  copy,
  dueDate,
  levels,
  note,
  onAssignmentToggle,
  onClose,
  onDeliver,
  onDueDateChange,
  onLevelChange,
  onNoteChange,
  onSubjectChange,
  open,
  schoolName,
  selectedCount,
  selectedAssignmentIds,
  selectedLevelId,
  selectedStudentNames,
  selectedSubjectId,
  subjects,
  topics,
}: {
  assignments: AssignmentCatalogItem[];
  canDeliver: boolean;
  copy: StudentCopy;
  dueDate: string;
  levels: AssignmentLevel[];
  note: string;
  onAssignmentToggle: (value: string) => void;
  onClose: () => void;
  onDeliver: () => void;
  onDueDateChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  open: boolean;
  schoolName: string;
  selectedCount: number;
  selectedAssignmentIds: string[];
  selectedLevelId: string;
  selectedStudentNames: string[];
  selectedSubjectId: string;
  subjects: AssignmentSubject[];
  topics: AssignmentTopic[];
}) {
  const titleId = useId();

  if (!open) return null;

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      aria-labelledby={titleId}
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: "8px 8px 0 0", sm: 1 },
            display: "flex",
            flexDirection: "column",
            m: { xs: 0, sm: 3 },
            maxHeight: "94vh",
            maxWidth: { xs: "100%", sm: "72rem" },
            overflow: "hidden",
            width: "100%",
          },
        },
      }}
    >
      <Stack
        component="header"
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-start", bgcolor: "background.default", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2 }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", bgcolor: "action.selected", borderRadius: 1, color: "primary.main", display: "inline-flex", fontWeight: "fontWeightBold", px: 1.25, py: 0.5, typography: "caption" }}
          >
            <AssignmentTurnedInOutlinedIcon fontSize="small" />
            <span>{copy.assignPanelTitle}</span>
          </Stack>
          <Typography id={titleId} component="h2" variant="h4" sx={{ mt: 1.5 }}>
            {copy.assignDialogTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 0.5 }}>{copy.assignDialogDescription}</Typography>
        </Box>
        <ErgIconButton label={copy.closeDialog} onClick={onClose} sx={{ border: 1, borderColor: "divider", borderRadius: 1, flexShrink: 0, height: 40, width: 40 }}>
          <CloseIcon fontSize="small" />
        </ErgIconButton>
      </Stack>

      <Box
        sx={{ bgcolor: "background.default", display: "grid", flex: 1, gap: 2, gridTemplateColumns: { lg: "300px minmax(0, 1fr)" }, minHeight: 0, overflowY: "auto", p: { xs: 2, lg: 3 } }}
      >
        <Stack component="aside" spacing={2}>
          <Box component="label" sx={{ display: "block" }}>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: "fontWeightBold" }}>
              {copy.subjectPickerLabel}
            </Typography>
            <ErgSelect
              size="small"
              options={subjects.map((subjectItem) => ({ label: subjectItem.label, value: subjectItem.id }))}
              slotProps={{ htmlInput: { "aria-label": copy.subjectPickerLabel } }}
              sx={{ mt: 1 }}
              onChange={(event) => onSubjectChange(event.target.value)}
              value={selectedSubjectId}
            />
          </Box>

          {selectedSubjectId ? (
            <PickerGroup label={copy.levelPickerLabel}>
              {levels.map((level) => {
                const selected = level.id === selectedLevelId;

                return (
                  <ButtonBase
                    aria-pressed={selected}
                    key={level.id}
                    onClick={() => onLevelChange(level.id)}
                    sx={pickerButtonSx(selected)}
                    type="button"
                  >
                    <Typography component="span" variant="subtitle2" sx={{ color: selected ? "primary.main" : "text.primary", display: "block" }}>{level.label}</Typography>
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {level.description}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </PickerGroup>
          ) : null}
        </Stack>

        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: { md: "space-between" } }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{copy.selectedRecipientsTitle}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: "42rem", mt: 0.5 }} title={selectedStudentNames.join(", ")}>
                  {formatSelectedStudentNames(selectedStudentNames, copy)}
                </Typography>
              </Box>
              <Chip label={copy.selectedRecipientsCount(selectedCount)} size="small" color="secondary" />
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {topics.map((topic, topicIndex) => (
              <TopicAssignmentGroup
                copy={copy}
                key={topic.id}
                onAssignmentToggle={onAssignmentToggle}
                selectedAssignmentIds={selectedAssignmentIds}
                topic={topic}
                topicIndex={topicIndex}
              />
            ))}
          </Stack>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "minmax(0, 1fr) 280px" } }}>
            <Paper variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
              <Box component="label" sx={{ display: "block" }}>
                <Typography component="span" variant="subtitle2" color="text.secondary">{copy.dueDateLabel}</Typography>
                <TextField
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) => onDueDateChange(event.target.value)}
                />
              </Box>

              <Box component="label" sx={{ display: "block", mt: 2 }}>
                <Typography component="span" variant="subtitle2" color="text.secondary">{copy.noteLabel}</Typography>
                <TextField
                  multiline
                  minRows={4}
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  placeholder={copy.notePlaceholder}
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                />
              </Box>
            </Paper>

            <AssignmentSummary assignments={assignments} copy={copy} />
          </Box>
        </Stack>
      </Box>

      <Stack
        component="footer"
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, bgcolor: "background.default", borderColor: "divider", borderTop: 1, justifyContent: { sm: "space-between" }, px: { xs: 2.5, sm: 3 }, py: 2 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{copy.deliveryHint(selectedCount, schoolName)}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" onClick={onClose}>
            {copy.cancelAction}
          </Button>
          <Button variant="contained" disabled={!canDeliver} onClick={onDeliver}>
            {copy.deliverAction(selectedCount)}
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

function PickerGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{label}</Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>{children}</Stack>
    </Box>
  );
}

function TopicAssignmentGroup({
  copy,
  onAssignmentToggle,
  selectedAssignmentIds,
  topic,
  topicIndex,
}: {
  copy: StudentCopy;
  onAssignmentToggle: (value: string) => void;
  selectedAssignmentIds: string[];
  topic: AssignmentTopic;
  topicIndex: number;
}) {
  const topicLabel = topic.label || copy.otherTopicLabel;

  return (
    <Paper component="section" variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          component="span"
          sx={{ bgcolor: "action.hover", borderRadius: 1, display: "grid", fontWeight: "fontWeightBold", height: 32, placeItems: "center", typography: "caption", width: 32 }}
        >
          {topicIndex + 1}
        </Box>
        <Box>
          <Typography component="h3" variant="subtitle2">{topicLabel}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold", mt: 0.25 }}>{copy.topicCount(topic.items.length)}</Typography>
        </Box>
      </Stack>

      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))" }, mt: 1.5 }}>
        {topic.items.map((item) => {
          const selected = selectedAssignmentIds.includes(item.id);

          return (
            <ButtonBase
              aria-pressed={selected}
              key={item.id}
              onClick={() => onAssignmentToggle(item.id)}
              sx={pickerButtonSx(selected)}
              type="button"
            >
              <Stack component="span" direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box component="span" sx={{ minWidth: 0 }}>
                  <Typography component="span" variant="subtitle2" sx={{ display: "block" }}>{item.activityLabel}</Typography>
                  <Stack component="span" direction="row" useFlexGap sx={{ alignItems: "center", color: "text.secondary", flexWrap: "wrap", fontWeight: "fontWeightBold", gap: 1, mt: 1, typography: "caption" }}>
                    <Box component="span" sx={metaPillSx}>{copy.questionCountValue(item.questionCount)}</Box>
                    <Box component="span" sx={metaPillSx}>
                      {copy.durationLabel}: {item.durationLabel}
                    </Box>
                  </Stack>
                </Box>
                <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Box
                    component="span"
                    sx={{
                      bgcolor: selected ? "primary.main" : "background.paper",
                      border: 1,
                      borderColor: selected ? "primary.main" : "divider",
                      borderRadius: 1,
                      color: "primary.contrastText",
                      display: "grid",
                      height: 24,
                      placeItems: "center",
                      width: 24,
                    }}
                  >
                    {selected ? <CheckIcon fontSize="inherit" /> : null}
                  </Box>
                  <Chip
                    label={item.kind === "test" ? copy.testType : copy.trainType}
                    size="small"
                    color={item.kind === "test" ? "warning" : "secondary"}
                  />
                </Stack>
              </Stack>
            </ButtonBase>
          );
        })}
      </Box>
    </Paper>
  );
}

function AssignmentSummary({ assignments, copy }: { assignments: AssignmentCatalogItem[]; copy: StudentCopy }) {
  if (assignments.length === 0) {
    return (
      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, borderStyle: "dashed", p: 2 }}>
        <Typography variant="subtitle2">{copy.noAssignmentSelectedTitle}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>{copy.noAssignmentSelectedDescription}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{copy.selectedActivitiesLabel}</Typography>
      <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{copy.selectedAssignmentsCount(assignments.length)}</Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {assignments.slice(0, 3).map((assignment) => (
          <Box key={assignment.id} sx={{ bgcolor: "background.default", borderRadius: 1, px: 1.5, py: 1 }}>
            <Typography variant="subtitle2" noWrap>{assignment.activityLabel}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.5 }}>
              {assignment.levelLabel} / {assignment.topicLabel}
            </Typography>
            <Stack direction="row" useFlexGap sx={{ alignItems: "center", color: "text.secondary", flexWrap: "wrap", fontWeight: "fontWeightBold", gap: 1, mt: 1, typography: "caption" }}>
              <Box component="span" sx={metaPillSx}>{copy.questionCountValue(assignment.questionCount)}</Box>
              <Box component="span" sx={metaPillSx}>
                {copy.durationLabel}: {assignment.durationLabel}
              </Box>
            </Stack>
          </Box>
        ))}
        {assignments.length > 3 ? <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "fontWeightBold" }}>+{assignments.length - 3}</Typography> : null}
      </Stack>
    </Box>
  );
}
