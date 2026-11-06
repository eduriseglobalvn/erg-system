import { useState } from "react";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type { QuestionType, QuizEditorSlide, QuizEditorSlideUpdate, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { convertSlideType } from "./convert-slide-type";
import { QuestionTypePickerDialog } from "./question-type-picker-dialog";

type Args = {
  selectedSlide: QuizEditorSlide | null;
  quizProject: QuizProjectSettings;
  createId: (prefix: string) => string;
  addQuestion: (type: QuestionType) => void;
  replaceSelectedSlide: (update: QuizEditorSlideUpdate) => void;
  addTitle: string;
  onAdded: () => void;
};

/** The type picker in its two modes: add a question, or change the selected question's type. */
export function useQuestionTypeChange({ selectedSlide, quizProject, createId, addQuestion, replaceSelectedSlide, addTitle, onAdded }: Args) {
  const [open, setOpen] = useState(false);
  // The mode outlives "open" so the title does not flip while the picker fades out.
  const [mode, setMode] = useState<"add" | "change">("add");
  const [pendingConversion, setPendingConversion] = useState<QuizEditorSlide | null>(null);

  // The question only exists once a type is picked; cancelling creates nothing. A change keeps the slide identity,
  // and answers that cannot carry over are confirmed before they are dropped.
  const handlePick = (type: QuestionType) => {
    setOpen(false);
    if (mode === "add") {
      addQuestion(type);
      onAdded();
      return;
    }
    // Picking the current type again is not a change; converting would drop the answers.
    if (!selectedSlide || type === selectedSlide.kind) return;
    const converted = convertSlideType(selectedSlide, type, buildQuestionSlide(type, quizProject, createId));
    if (converted.dropsAnswers) setPendingConversion(converted.slide);
    else replaceSelectedSlide(converted.slide);
  };

  const dialogs = (
    <>
      <QuestionTypePickerDialog
        open={open}
        title={mode === "change" ? "Đổi dạng câu hỏi" : addTitle}
        description={mode === "change" ? "Chọn dạng mới cho câu này." : undefined}
        confirmLabel={mode === "change" ? (label) => `Đổi sang ${label}` : undefined}
        onPick={handlePick}
        onClose={() => setOpen(false)}
      />
      <ErgConfirmDialog
        open={pendingConversion !== null}
        title="Đổi dạng sẽ bỏ phần đáp án hiện tại. Tiếp tục?"
        confirmLabel="Đổi dạng"
        destructive
        onCancel={() => setPendingConversion(null)}
        onConfirm={() => {
          if (pendingConversion) replaceSelectedSlide(pendingConversion);
          setPendingConversion(null);
        }}
      />
    </>
  );

  const openPicker = (next: "add" | "change") => {
    setMode(next);
    setOpen(true);
  };
  return { openPicker, dialogs };
}
