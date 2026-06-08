import type { ReactNode } from "react";

import { useI18n } from "@/platform/i18n";
import { AppSelect } from "@/components/ui/app-select";
import type {
  QuizEditorFinalSlideOptions,
  QuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function FinalSlideOptionsSection({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const finalOptions = slide.options?.finalSlide;

  return (
    <>
      <div className="classic-editor__options-title">{t("quiz.finalSlideOptions")}</div>
      <div className="classic-editor__options-divider" />

      <div className="classic-editor__option-form">
        <OptionRow label={t("quiz.whenQuizIsFinished")} stacked>
          <AppSelect
            className="classic-editor__select classic-editor__select--wide"
            value={finalOptions?.whenQuizFinished ?? t("quiz.showSlideWithResults")}
            onChange={(event) => onUpdateOptions({ whenQuizFinished: event.target.value })}
          >
            {[t("quiz.showSlideWithResults"), t("quiz.closeBrowserWindow"), t("quiz.showThankYouMessage")].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </AppSelect>
        </OptionRow>
      </div>

      <div className="classic-editor__options-subtitle is-success">
        {t("quiz.whenUserPasses")}
      </div>
      <div className="classic-editor__checkbox-list">
        <label><input type="checkbox" checked={finalOptions?.showUserScore ?? false} onChange={(event) => onUpdateOptions({ showUserScore: event.target.checked })} /> {t("quiz.showUsersScore")}</label>
        <label><input type="checkbox" checked={finalOptions?.showPassingScore ?? false} onChange={(event) => onUpdateOptions({ showPassingScore: event.target.checked })} /> {t("quiz.showPassingScore")}</label>
        <label><input type="checkbox" checked={finalOptions?.allowReview ?? false} onChange={(event) => onUpdateOptions({ allowReview: event.target.checked })} /> {t("quiz.allowUserReviewQuiz")}</label>
        <label className="classic-editor__checkbox-indent"><input type="checkbox" checked={finalOptions?.showCorrectAnswers ?? false} onChange={(event) => onUpdateOptions({ showCorrectAnswers: event.target.checked })} /> {t("quiz.showCorrectAnswers")}</label>
        <label><input type="checkbox" checked={finalOptions?.showDetailedReport ?? false} onChange={(event) => onUpdateOptions({ showDetailedReport: event.target.checked })} /> {t("quiz.showDetailedReport")}</label>
        <label className="classic-editor__checkbox-indent"><input type="checkbox" checked={finalOptions?.showResultsByGroup ?? false} onChange={(event) => onUpdateOptions({ showResultsByGroup: event.target.checked })} /> {t("quiz.showResultsByGroup")}</label>
        <label className="classic-editor__checkbox-indent"><input type="checkbox" checked={finalOptions?.showAnswerResults ?? false} onChange={(event) => onUpdateOptions({ showAnswerResults: event.target.checked })} /> {t("quiz.showAnswerResults")}</label>
        <label className="classic-editor__checkbox-indent"><input type="checkbox" checked={finalOptions?.allowPrintResults ?? false} onChange={(event) => onUpdateOptions({ allowPrintResults: event.target.checked })} /> {t("quiz.allowUserToPrintResults")}</label>
      </div>

      <div className="classic-editor__retry-row">
        <label>
          <input type="checkbox" checked={finalOptions?.allowRetry ?? false} onChange={(event) => onUpdateOptions({ allowRetry: event.target.checked })} />{" "}
          {t("quiz.allowUserRetryQuiz")}
        </label>
        <AppSelect
          className="classic-editor__select"
          value={finalOptions?.retryLabel ?? t("quiz.retryOnce")}
          onChange={(event) => onUpdateOptions({ retryLabel: event.target.value })}
        >
          {[t("quiz.retryOnce"), t("quiz.retryTwice"), t("quiz.retryUnlimited")].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </AppSelect>
      </div>
    </>
  );
}

function OptionRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "classic-editor__option-row is-stacked" : "classic-editor__option-row"}>
      <span>{label}</span>
      {children}
    </div>
  );
}
