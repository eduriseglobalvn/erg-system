import type { Dispatch, SetStateAction } from "react";
import {
  PropertyField,
  PropertySection,
  QuizResultPreview,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";

export type QuizResultSectionProps = {
  draft: QuizProjectSettings;
  setDraft: Dispatch<SetStateAction<QuizProjectSettings>>;
};

export function QuizResultSection({ draft, setDraft }: QuizResultSectionProps) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__property-visual-grid">
      <div className="classic-editor__property-editor-column">
        <PropertySection title={t("common.feedback")}>
          <div className="classic-editor__property-radio-row">
            <label className="classic-editor__property-radio">
              <input
                type="radio"
                checked={draft.result.feedbackMode === "according-to-result"}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    result: { ...current.result, feedbackMode: "according-to-result" },
                  }))
                }
              />
              <span>{t("quiz.propertiesFeedbackAccordingToResult")}</span>
            </label>
            <label className="classic-editor__property-radio">
              <input
                type="radio"
                checked={draft.result.feedbackMode === "despite-the-result"}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    result: { ...current.result, feedbackMode: "despite-the-result" },
                  }))
                }
              />
              <span>{t("quiz.propertiesFeedbackDespiteResult")}</span>
            </label>
          </div>

          <PropertyField label={t("quiz.whenUserPasses")}>
            <textarea
              value={draft.result.passMessage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, passMessage: event.target.value },
                }))
              }
              className="classic-editor__textarea classic-editor__property-textarea"
              rows={4}
            />
          </PropertyField>

          <PropertyField label={t("quiz.whenUserFails")}>
            <textarea
              value={draft.result.failMessage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, failMessage: event.target.value },
                }))
              }
              className="classic-editor__textarea classic-editor__property-textarea"
              rows={4}
            />
          </PropertyField>
        </PropertySection>

        <PropertySection title={t("quiz.propertiesSectionFinishButton")}>
          <label className="classic-editor__property-check">
            <input
              type="checkbox"
              checked={draft.result.showStatistics}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, showStatistics: event.target.checked },
                }))
              }
            />
            <span>{t("quiz.propertiesDisplayResultStatistics")}</span>
          </label>
          <label className="classic-editor__property-check">
            <input
              type="checkbox"
              checked={draft.result.showFinishButton}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, showFinishButton: event.target.checked },
                }))
              }
            />
            <span>{t("quiz.propertiesShowFinishButton")}</span>
          </label>

          <PropertyField label={t("quiz.propertiesPassRedirect")}>
            <input
              value={draft.result.passRedirect}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, passRedirect: event.target.value },
                }))
              }
              className="classic-editor__text-input"
            />
          </PropertyField>
          <PropertyField label={t("quiz.propertiesFailRedirect")}>
            <input
              value={draft.result.failRedirect}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, failRedirect: event.target.value },
                }))
              }
              className="classic-editor__text-input"
            />
          </PropertyField>
          <PropertyField label="Review button label">
            <input
              value={draft.result.reviewButtonLabel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, reviewButtonLabel: event.target.value },
                }))
              }
              className="classic-editor__text-input"
            />
          </PropertyField>
          <PropertyField label="Thank-you message">
            <input
              value={draft.result.thankYouMessage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, thankYouMessage: event.target.value },
                }))
              }
              className="classic-editor__text-input"
            />
          </PropertyField>
          <label className="classic-editor__property-check">
            <input
              type="checkbox"
              checked={draft.result.openInCurrentWindow}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  result: { ...current.result, openInCurrentWindow: event.target.checked },
                }))
              }
            />
            <span>{t("quiz.propertiesOpenCurrentWindow")}</span>
          </label>
        </PropertySection>
      </div>

      <QuizResultPreview
        value={draft}
      />
    </div>
  );
}
