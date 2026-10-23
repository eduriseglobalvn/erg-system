import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import { getQuestionBankPackageTotalPoints } from "@/features/lcms/quiz/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

export type QuizCreateDraft = {
  title: string;
  kind: "train" | "test";
  timeLimitEnabled: boolean;
  timeLimitMinutes: number;
  passingScoreMode: "percent" | "points";
  passingRate: number;
  passingScorePoints: number;
  templateLayout: NonNullable<CreateQuizFromBankOptions["templateLayout"]>;
  playerSize: NonNullable<CreateQuizFromBankOptions["playerSize"]>;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
};

export type QuizCreatePackageDialogCopy = {
  cancel: string;
  close: string;
  createQuizConfirm: string;
  createQuizDialogDescription: (count: number) => string;
  createQuizDialogTitle: string;
  noTimeLimitLabel: string;
  packageInfoTitle: string;
  packagePreviewDescription: (count: number) => string;
  packagePreviewTitle: string;
  packageSettingsTitle: string;
  passingPointsLabel: string;
  passingRateLabel: string;
  passingScoreMode: Record<QuizCreateDraft["passingScoreMode"], string>;
  passingScoreModeLabel: string;
  playerSize: Record<QuizCreateDraft["playerSize"], string>;
  playerSizeLabel: string;
  pointsValue: (points: number) => string;
  quizKind: Record<QuizCreateDraft["kind"], string>;
  quizKindLabel: string;
  quizTitleLabel: string;
  requiredPointsPreviewLabel: string;
  selectedQuestionCount: string;
  shuffleAnswersLabel: string;
  shuffleQuestionsLabel: string;
  status: Record<QuestionBankQuestion["status"], string>;
  templateLayout: Record<QuizCreateDraft["templateLayout"], string>;
  templateLayoutLabel: string;
  timeLimitLabel: string;
  totalPointsLabel: string;
};

export function QuizPackageDialogShell({
  actions,
  badges,
  children,
  closeLabel,
  description,
  onClose,
  title,
}: {
  actions?: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  closeLabel: string;
  description: ReactNode;
  onClose: () => void;
  title: ReactNode;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: "min(980px, calc(100vw - 32px))",
            maxWidth: "980px",
            minWidth: 0,
            maxHeight: "calc(100vh - 104px)",
            margin: 0,
          },
        },
      }}
      className="[&_.MuiDialog-paper]:overflow-hidden [&_.MuiDialog-paper]:rounded-2xl [&_.MuiDialog-paper]:border [&_.MuiDialog-paper]:border-slate-200 [&_.MuiDialog-paper]:bg-white [&_.MuiDialog-paper]:shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
    >
      <DialogTitle className="relative border-b border-slate-100 px-7 py-5 pr-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-extrabold leading-7 text-slate-950">{title}</div>
            <div className="mt-1 text-sm font-medium text-slate-500">{description}</div>
          </div>
          {badges ? <div className="flex shrink-0 flex-wrap items-center gap-2 pr-1">{badges}</div> : null}
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      </DialogTitle>
      <DialogContent className="bg-[#fbfdff] px-7 py-5">{children}</DialogContent>
      {actions ? (
        <DialogActions className="min-h-[72px] items-center border-t border-slate-100 bg-white px-6 py-0">
          {actions}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}

export function QuizCreatePackageDialog({
  copy,
  draft,
  questions,
  submitLabel,
  title,
  description,
  onChange,
  onClose,
  onSubmit,
}: {
  copy: QuizCreatePackageDialogCopy;
  draft: QuizCreateDraft;
  questions: QuestionBankQuestion[];
  submitLabel?: string;
  title?: string;
  description?: string;
  onChange: (draft: QuizCreateDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const questionCount = questions.length;
  const totalPoints = getQuestionBankPackageTotalPoints(questions);
  const passingPoints =
    draft.passingScoreMode === "points"
      ? draft.passingScorePoints
      : Math.round(totalPoints * (draft.passingRate / 100) * 100) / 100;

  return (
    <QuizPackageDialogShell
      closeLabel={copy.close}
      description={description ?? copy.createQuizDialogDescription(questionCount)}
      onClose={onClose}
      title={title ?? copy.createQuizDialogTitle}
      actions={
        <>
          <Button onClick={onClose}>{copy.cancel}</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!draft.title.trim() || questionCount === 0}>
            {submitLabel ?? copy.createQuizConfirm}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{copy.packageInfoTitle}</div>
            <TextField
              autoFocus
              fullWidth
              label={copy.quizTitleLabel}
              value={draft.title}
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
            />
            <div className="mt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{copy.quizKindLabel}</div>
              <div className="grid grid-cols-2 gap-2">
                {(["train", "test"] as const).map((kind) => (
                  <Button
                    key={kind}
                    variant={draft.kind === kind ? "contained" : "outlined"}
                    onClick={() => onChange({ ...draft, kind })}
                    className="h-11 rounded-xl font-bold"
                  >
                    {copy.quizKind[kind]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{copy.packageSettingsTitle}</div>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <MetricTile label={copy.totalPointsLabel} value={copy.pointsValue(totalPoints)} />
              <MetricTile label={copy.selectedQuestionCount} value={String(questionCount)} />
              <MetricTile label={copy.requiredPointsPreviewLabel} value={copy.pointsValue(passingPoints)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <NumberField
                  disabled={!draft.timeLimitEnabled}
                  label={copy.timeLimitLabel}
                  value={draft.timeLimitMinutes}
                  onChange={(value) => onChange({ ...draft, timeLimitMinutes: value })}
                />
                <PackageToggle
                  checked={!draft.timeLimitEnabled}
                  label={copy.noTimeLimitLabel}
                  onChange={(checked) => onChange({ ...draft, timeLimitEnabled: !checked })}
                />
              </div>
              <div className="grid gap-2">
                <SelectField
                  label={copy.passingScoreModeLabel}
                  value={draft.passingScoreMode}
                  onChange={(value) => onChange({ ...draft, passingScoreMode: value as QuizCreateDraft["passingScoreMode"] })}
                  options={[
                    { value: "percent", label: copy.passingScoreMode.percent },
                    { value: "points", label: copy.passingScoreMode.points },
                  ]}
                />
                {draft.passingScoreMode === "points" ? (
                  <NumberField
                    label={copy.passingPointsLabel}
                    value={draft.passingScorePoints}
                    onChange={(value) => onChange({ ...draft, passingScorePoints: value })}
                  />
                ) : (
                  <NumberField
                    label={copy.passingRateLabel}
                    value={draft.passingRate}
                    onChange={(value) => onChange({ ...draft, passingRate: value })}
                  />
                )}
              </div>
              <SelectField
                label={copy.templateLayoutLabel}
                value={draft.templateLayout}
                onChange={(value) => onChange({ ...draft, templateLayout: value as QuizCreateDraft["templateLayout"] })}
                options={[
                  { value: "classic", label: copy.templateLayout.classic },
                  { value: "focus", label: copy.templateLayout.focus },
                  { value: "split", label: copy.templateLayout.split },
                ]}
              />
              <SelectField
                label={copy.playerSizeLabel}
                value={draft.playerSize}
                onChange={(value) => onChange({ ...draft, playerSize: value as QuizCreateDraft["playerSize"] })}
                options={[
                  { value: "standard", label: copy.playerSize.standard },
                  { value: "wide", label: copy.playerSize.wide },
                ]}
              />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <PackageToggle
                checked={draft.shuffleQuestions}
                label={copy.shuffleQuestionsLabel}
                onChange={(checked) => onChange({ ...draft, shuffleQuestions: checked })}
              />
              <PackageToggle
                checked={draft.shuffleAnswers}
                label={copy.shuffleAnswersLabel}
                onChange={(checked) => onChange({ ...draft, shuffleAnswers: checked })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-sm font-extrabold text-slate-950">{copy.packagePreviewTitle}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">{copy.packagePreviewDescription(questionCount)}</div>
          </div>
          <div className="max-h-[min(60vh,620px)] divide-y divide-slate-100 overflow-y-auto">
            {questions.map((question, index) => (
              <div key={question.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-bold leading-6 text-slate-900">{question.stem}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                        {question.categoryLabel}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        {copy.status[question.status]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </QuizPackageDialogShell>
  );
}

function PackageToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#0f6cbd]"
      />
    </label>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-base font-extrabold text-slate-950">{value}</div>
    </div>
  );
}

function NumberField({
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
    <label className="block select-none">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <input
        disabled={disabled}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 h-10 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[#242424] shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-[var(--erg-blue-ring)] disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="block select-none">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[#242424] shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
