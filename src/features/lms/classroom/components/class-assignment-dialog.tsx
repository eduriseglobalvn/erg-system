import type { ReactNode } from "react";

import { Check, ClipboardCheck, X } from "lucide-react";

import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { cn } from "@/lib/utils";
import type { StudentCopy } from "./class-students-workspace.copy";
import type { AssignmentCatalogItem, AssignmentLevel, AssignmentSubject, AssignmentTopic } from "./class-students-workspace.types";
import { formatSelectedStudentNames } from "./class-students-workspace.utils";
import { AppSelect } from "@/components/ui/app-select";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        aria-modal="true"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-sm sm:mx-auto sm:max-w-6xl sm:rounded-lg"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#cbd7e6] bg-[#f8fbff] px-5 py-4 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#ebf3fc] px-2.5 py-1 text-[13px] font-bold text-[#0f5ea8]">
              <ClipboardCheck className="h-4 w-4" />
              {copy.assignPanelTitle}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">
              {copy.assignDialogTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{copy.assignDialogDescription}</p>
          </div>
          <button
            aria-label={copy.closeDialog}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#cbd7e6] bg-white text-slate-700 transition hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erg-blue-ring)]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto bg-slate-50/80 p-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:p-6">
          <aside className="space-y-4">
            <label className="block">
              <span className="text-[13px] font-semibold text-slate-600">
                {copy.subjectPickerLabel}
              </span>
              <AppSelect
                aria-label={copy.subjectPickerLabel}
                className="mt-2 h-10 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-950 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                onChange={(event) => onSubjectChange(event.target.value)}
                value={selectedSubjectId}
              >
                {subjects.map((subjectItem) => (
                  <option key={subjectItem.id} value={subjectItem.id}>
                    {subjectItem.label}
                  </option>
                ))}
              </AppSelect>
            </label>

            {selectedSubjectId ? (
              <PickerGroup label={copy.levelPickerLabel}>
                {levels.map((level) => {
                  const selected = level.id === selectedLevelId;

                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erg-blue-ring)]",
                        selected ? "border-[#b8d6fa] bg-[#ebf3fc] text-[#0f5ea8]" : "border-[#cbd7e6] bg-white/80 text-slate-700 hover:bg-white",
                      )}
                      key={level.id}
                      onClick={() => onLevelChange(level.id)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold">{level.label}</span>
                      <span className={cn("mt-1 block text-[13px] leading-5", selected ? "text-slate-300" : "text-slate-600")}>
                        {level.description}
                      </span>
                    </button>
                  );
                })}
              </PickerGroup>
            ) : null}
          </aside>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">{copy.selectedRecipientsTitle}</div>
                  <div className="mt-1 max-w-2xl truncate text-sm text-slate-500" title={selectedStudentNames.join(", ")}>
                    {formatSelectedStudentNames(selectedStudentNames, copy)}
                  </div>
                </div>
                <Chip label={copy.selectedRecipientsCount(selectedCount)} size="small" color="secondary" />
              </div>
            </div>

            <div className="space-y-4">
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
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{copy.dueDateLabel}</span>
                  <TextField
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) => onDueDateChange(event.target.value)}
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-slate-700">{copy.noteLabel}</span>
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
                </label>
              </div>

              <AssignmentSummary assignments={assignments} copy={copy} />
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#cbd7e6] bg-[#f8fbff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm leading-6 text-slate-500">{copy.deliveryHint(selectedCount, schoolName)}</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outlined" onClick={onClose}>
              {copy.cancelAction}
            </Button>
            <Button variant="contained" disabled={!canDeliver} onClick={onDeliver}>
              {copy.deliverAction(selectedCount)}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function PickerGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
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
    <section className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-[13px] font-bold text-slate-700">
          {topicIndex + 1}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{topicLabel}</h3>
          <p className="mt-0.5 text-[13px] font-semibold text-slate-600">{copy.topicCount(topic.items.length)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {topic.items.map((item) => {
          const selected = selectedAssignmentIds.includes(item.id);

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erg-blue-ring)]",
                selected ? "border-[#b8d6fa] bg-[#ebf3fc]" : "border-[#cbd7e6] bg-white hover:bg-[#f8fbff]",
              )}
              key={item.id}
              onClick={() => onAssignmentToggle(item.id)}
              type="button"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">{item.activityLabel}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-1">{copy.questionCountValue(item.questionCount)}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1">
                      {copy.durationLabel}: {item.durationLabel}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-md border text-[12px] font-bold",
                      selected ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white" : "border-slate-300 bg-white",
                    )}
                  >
                    {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </span>
                  <Chip
                    label={item.kind === "test" ? copy.testType : copy.trainType}
                    size="small"
                    color={item.kind === "test" ? "warning" : "secondary"}
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AssignmentSummary({ assignments, copy }: { assignments: AssignmentCatalogItem[]; copy: StudentCopy }) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <div className="text-sm font-semibold text-slate-950">{copy.noAssignmentSelectedTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-500">{copy.noAssignmentSelectedDescription}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-3">
      <div className="text-[13px] font-semibold text-slate-600">{copy.selectedActivitiesLabel}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{copy.selectedAssignmentsCount(assignments.length)}</div>
      <div className="mt-2 space-y-2">
        {assignments.slice(0, 3).map((assignment) => (
          <div key={assignment.id} className="rounded-lg bg-white px-3 py-2">
            <div className="line-clamp-1 text-sm font-semibold text-slate-950">{assignment.activityLabel}</div>
            <div className="mt-1 line-clamp-1 text-[13px] leading-5 text-slate-600">
              {assignment.levelLabel} / {assignment.topicLabel}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-600">
              <span className="rounded-md bg-slate-100 px-2 py-1">{copy.questionCountValue(assignment.questionCount)}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1">
                {copy.durationLabel}: {assignment.durationLabel}
              </span>
            </div>
          </div>
        ))}
        {assignments.length > 3 ? <div className="text-[13px] font-semibold text-slate-600">+{assignments.length - 3}</div> : null}
      </div>
    </div>
  );
}

