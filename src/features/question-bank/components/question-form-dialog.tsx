import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { QuestionCard } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-card";
import { questionTypeLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import { QuestionTypePickerDialog } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-picker-dialog";
import { readSlideQuestion, readSlideReadiness } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/slide-question";
import type { QuizEditorSlideUpdate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";
import type { QuestionBankCopy } from "./question-bank-copy";
import { SelectControl } from "./question-bank-primitives";
import type { QuestionFormDraft, QuestionFormMode } from "./question-bank-workspace-types";

export function QuestionFormDialog({
  copy,
  draft,
  mode,
  onChange,
  onClose,
  onSubmit,
  saving,
}: {
  copy: QuestionBankCopy;
  draft: QuestionFormDraft;
  mode: QuestionFormMode;
  onChange: (draft: QuestionFormDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const { t } = useI18n();
  const update = <K extends keyof QuestionFormDraft>(key: K, value: QuestionFormDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };
  const { slide } = draft;

  // Same 14 types and cards as the quiz editor; the question only exists once a type is picked.
  if (!slide) {
    return (
      <QuestionTypePickerDialog
        open
        title={copy.createQuestionTitle}
        onClose={onClose}
        onPick={(type) =>
          update(
            "slide",
            buildQuestionSlide(type, createNewQuizProjectSettings(), (prefix) => `${prefix}-${crypto.randomUUID()}`),
          )
        }
      />
    );
  }
  // shortcut: reads the slide from this render, so an async image result can overwrite an edit made meanwhile.
  const replaceSlide = (next: QuizEditorSlideUpdate) => update("slide", typeof next === "function" ? next(slide) : next);
  const typeLabel = questionTypeLabel(slide.kind as Parameters<typeof questionTypeLabel>[0]);

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "edit" ? copy.editQuestionTitle : copy.createQuestionTitle}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <QuestionCard
          key={slide.id}
          meta={typeLabel}
          onReplaceSlide={replaceSlide}
          question={readSlideQuestion(slide, t)}
          readiness={readSlideReadiness(slide, t)}
          slide={slide}
        />
        <TextField
          label={copy.questionObjectiveLabel}
          value={draft.objective}
          onChange={(event) => update("objective", event.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectControl
            label={copy.questionDifficultyLabel}
            value={draft.difficulty}
            onChange={(value) => update("difficulty", value as QuestionFormDraft["difficulty"])}
            options={[
              { value: "core", label: copy.difficulty.core },
              { value: "stretch", label: copy.difficulty.stretch },
              { value: "challenge", label: copy.difficulty.challenge },
            ]}
          />
          <SelectControl
            label={copy.questionStatusLabel}
            value={draft.status}
            onChange={(value) => update("status", value as QuestionFormDraft["status"])}
            options={[
              { value: "ready", label: copy.status.ready },
              { value: "reviewing", label: copy.status.reviewing },
              { value: "pilot", label: copy.status.pilot },
            ]}
          />
          <TextField
            label={copy.questionTagsLabel}
            value={draft.tagsText}
            onChange={(event) => update("tagsText", event.target.value)}
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={saving}>{copy.cancel}</Button>
        <Button onClick={onSubmit} disabled={saving || !slide.title.trim()} variant="contained">
          {saving ? copy.savingQuestion : copy.saveQuestion}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function QuestionBankSyncNotice({ detail, message }: { detail: string; message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
    >
      <div className="font-semibold">{message}</div>
      <div className="mt-1 text-xs leading-relaxed text-amber-900">{detail}</div>
    </div>
  );
}

export function LabeledNumberField({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <TextField
      disabled={disabled}
      fullWidth
      label={label}
      type="number"
      size="small"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
      sx={{
        "& .MuiOutlinedInput-root": {
          bgcolor: "#fff",
          borderRadius: 2,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        },
        "& .MuiInputLabel-root": {
          fontSize: 12,
          fontWeight: 600,
        },
      }}
    />
  );
}

