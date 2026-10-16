import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
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
  const update = <K extends keyof QuestionFormDraft>(key: K, value: QuestionFormDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "edit" ? copy.editQuestionTitle : copy.createQuestionTitle}</DialogTitle>
      <DialogContent className="space-y-4 pt-2">
        <TextField
          label={copy.questionStemLabel}
          value={draft.stem}
          onChange={(event) => update("stem", event.target.value)}
          fullWidth
          required
          multiline
          minRows={2}
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
            label={copy.questionTypeLabel}
            value={draft.type}
            onChange={(value) => update("type", value as QuestionFormDraft["type"])}
            options={[
              { value: "multiple-choice", label: "Multiple choice" },
              { value: "multiple-response", label: "Multiple response" },
              { value: "true-false", label: "True/false" },
              { value: "short-answer", label: "Short answer" },
            ]}
          />
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
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="A" value={draft.choiceA} onChange={(event) => update("choiceA", event.target.value)} fullWidth />
          <TextField label="B" value={draft.choiceB} onChange={(event) => update("choiceB", event.target.value)} fullWidth />
          <TextField label="C" value={draft.choiceC} onChange={(event) => update("choiceC", event.target.value)} fullWidth />
          <TextField label="D" value={draft.choiceD} onChange={(event) => update("choiceD", event.target.value)} fullWidth />
        </div>
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <TextField
            label={copy.questionAnswerLabel}
            value={draft.answer}
            onChange={(event) => update("answer", event.target.value)}
            fullWidth
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
        <Button onClick={onClose} disabled={saving}>{copy.cancel}</Button>
        <Button onClick={onSubmit} disabled={saving || !draft.stem.trim()} variant="contained">
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
          fontWeight: 800,
        },
      }}
    />
  );
}

