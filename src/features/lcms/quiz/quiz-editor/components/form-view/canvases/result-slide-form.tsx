import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  AudioTextField,
  FieldLabel,
  FormViewSection,
} from "@/features/lcms/quiz/quiz-editor/components/form-view/authoring-frame";
import { ResultTabs } from "@/features/lcms/quiz/quiz-editor/components/form-view/result-tabs";

export function ResultSlideForm({
  slide,
  onChangeTab,
}: {
  slide: QuizEditorSlide;
  onChangeTab: (tab: "passed" | "failed") => void;
}) {
  const { t } = useI18n();
  const activeTab = slide.activeResultTab ?? "passed";

  return (
    <FormViewSection title={t("common.quizResults")}>
      <ResultTabs activeTab={activeTab} onChange={onChangeTab} />

      <div className="classic-editor__result-panel">
        <AudioTextField
          value={activeTab === "passed" ? t("quiz.greatYoureSharp") : t("quiz.tryAgainMessage")}
          onChange={() => {}}
          slide={slide}
        />
      </div>

      <FieldLabel label={t("quiz.finishAction")} />
      <select className="classic-editor__select classic-editor__select--result">
        <option>{slide.finishAction ?? t("quiz.closeBrowserWindow")}</option>
      </select>
    </FormViewSection>
  );
}
