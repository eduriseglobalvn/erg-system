import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorGroup, QuizEditorSlide, QuizEditorSlideUpdate, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getFeedbackText } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { QuestionCard } from "./question-card";
import { QuestionEditorRail, type RailEntry } from "./question-editor-rail";
import { QuestionEditorTitlebar } from "./question-editor-titlebar";
import { questionTypeLabel } from "./question-type-catalog";
import type { QuestionView } from "./question-view-toggle";
import { readSlideQuestion, readSlideReadiness } from "./slide-question";
import { QuizTryRunner } from "./try-run/quiz-try-runner";
import { defaultTryRunMode } from "./try-run/try-run-model";

type Props = {
  groups: QuizEditorGroup[];
  selectedSlide: QuizEditorSlide;
  onSelectSlide: (groupId: string, slideId: string) => void;
  onReplaceSlide: (update: QuizEditorSlideUpdate) => void;
  onAddQuestion: () => void;
  onChangeType: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
  syncChip: ReactNode;
  /** Sync notices (offline, recovery) shown under the title bar; the full-screen editor covers the page's copy. */
  banner: ReactNode;
  quizKind?: string;
  /** Holds the publish fingerprints the rail compares each question with. */
  quizProject: Pick<QuizProjectSettings, "publishedFingerprints">;
};

export function QuestionEditorShell(props: Props) {
  const { groups, selectedSlide: slide, onSelectSlide, onReplaceSlide, onClose, quizKind } = props;
  const { t } = useI18n();
  const [view, setView] = useState<QuestionView>("author");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Opened on question slides only: intro slides stay in the draft with no editor, and are never counted or numbered.
  const entries: RailEntry[] = groups.flatMap((group) =>
    group.slides.filter((item) => isQuestionType(item.kind)).map((item) => ({ groupId: group.id, slide: item })),
  );
  const index = entries.findIndex((entry) => entry.slide.id === slide.id);
  const question = readSlideQuestion(slide, t);
  const readiness = readSlideReadiness(slide, t);
  const typeLabel = isQuestionType(slide.kind) ? questionTypeLabel(slide.kind) : "";

  const deleteQuestion = () => {
    setConfirmingDelete(false);
    const neighbour = entries[index + 1] ?? entries[index - 1];
    props.onDelete();
    if (neighbour) onSelectSlide(neighbour.groupId, neighbour.slide.id);
    else onClose();
  };

  const runnable =
    view === "learner"
      ? entries.flatMap(({ slide: item }) => {
          const runtime = readSlideQuestion(item, t);
          return runtime ? [{ slide: item, question: runtime }] : [];
        })
      : [];
  const feedback = Object.fromEntries(
    runnable.map(({ slide: item, question: runtime }) => [
      runtime.id,
      { correct: getFeedbackText(item, "correct") || undefined, incorrect: getFeedbackText(item, "incorrect") || undefined },
    ]),
  );

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      open
      slotProps={{ paper: { "aria-label": "Soạn câu hỏi", sx: { bgcolor: tokens.color.surfaceSubtle } } }}
    >
      <QuestionEditorTitlebar
        onBack={onClose}
        onChangeType={props.onChangeType}
        onDelete={() => setConfirmingDelete(true)}
        onDuplicate={props.onDuplicate}
        onViewChange={setView}
        readiness={readiness}
        position={`Câu ${index + 1} / ${entries.length}`}
        syncChip={props.syncChip}
        typeLabel={typeLabel}
        view={view}
      />
      {props.banner}
      <Box sx={{ display: "flex", flex: 1, flexWrap: "wrap", minHeight: 0, overflow: "auto" }}>
        {view === "author" ? (
          <>
            <QuestionEditorRail
              entries={entries}
              groups={groups}
              onAdd={props.onAddQuestion}
              onSelect={onSelectSlide}
              quizProject={props.quizProject}
              selectedSlideId={slide.id}
            />
            <Box sx={{ flex: "1 1 560px", minWidth: 0, px: 4, py: 3.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mx: "auto", maxWidth: 720 }}>
                <QuestionCard
                  key={slide.id}
                  meta={`Câu ${index + 1} · ${typeLabel}`}
                  onReplaceSlide={onReplaceSlide}
                  question={question}
                  readiness={readiness}
                  slide={slide}
                />
                <Typography color="text.secondary" variant="caption">
                  Điểm, thời gian, trộn đáp án đặt ở “Cài đặt gói” trong Ngân hàng câu hỏi, không đặt ở từng câu.
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, minWidth: 0, px: 4, py: 3.5 }}>
            <QuizTryRunner
              feedback={feedback}
              initialMode={defaultTryRunMode(quizKind)}
              questions={runnable.map((entry) => entry.question)}
              startIndex={Math.max(0, runnable.findIndex((entry) => entry.slide.id === slide.id))}
            />
          </Box>
        )}
      </Box>
      <ErgConfirmDialog
        confirmLabel="Xoá"
        destructive
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={deleteQuestion}
        open={confirmingDelete}
        title="Xoá câu hỏi này?"
      />
    </Dialog>
  );
}
