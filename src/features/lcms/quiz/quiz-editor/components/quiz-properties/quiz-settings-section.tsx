import type { Dispatch, SetStateAction } from "react";
import { PropertyField, PropertySection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";

export type QuizSettingsSectionProps = {
  draft: QuizProjectSettings;
  setDraft: Dispatch<SetStateAction<QuizProjectSettings>>;
};

export function QuizSettingsSection({ draft, setDraft }: QuizSettingsSectionProps) {
  const { t } = useI18n();

  return (
    <>
          <PropertySection title={t("quiz.propertiesSectionPassingRate")}>
            <PropertyField label={t("quiz.propertiesPassingRate")}>
              <div className="classic-editor__property-inline">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.settings.passingRate}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        passingRate: Number(event.target.value),
                      },
                    }))
                  }
                  className="classic-editor__property-number"
                />
                <span>%</span>
              </div>
            </PropertyField>
          </PropertySection>

          <PropertySection title={t("quiz.propertiesSectionTimeLimit")}>
            <label className="classic-editor__property-check">
              <input
                type="checkbox"
                checked={draft.settings.enableTimeLimit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      enableTimeLimit: event.target.checked,
                    },
                  }))
                }
              />
              <span>{t("quiz.propertiesEnableTimeLimit")}</span>
            </label>

            <PropertyField label={t("quiz.propertiesLimit")}>
              <input
                value={draft.settings.timeLimit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    settings: { ...current.settings, timeLimit: event.target.value },
                  }))
                }
                className="classic-editor__text-input"
                disabled={!draft.settings.enableTimeLimit}
              />
            </PropertyField>
          </PropertySection>

          <PropertySection title={t("quiz.propertiesSectionRandomization")}>
            <label className="classic-editor__property-check">
              <input
                type="checkbox"
                checked={draft.settings.randomizeQuestionOrder}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      randomizeQuestionOrder: event.target.checked,
                    },
                  }))
                }
              />
              <span>{t("quiz.propertiesRandomizeBeforePublish")}</span>
            </label>

            <PropertyField label={t("quiz.propertiesRandomCount")}>
              <input
                type="number"
                min={1}
                value={draft.settings.randomQuestionCount}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      randomQuestionCount: Number(event.target.value),
                    },
                  }))
                }
                className="classic-editor__property-number"
              />
            </PropertyField>
          </PropertySection>

          <PropertySection title={t("quiz.propertiesSectionAnswerSubmission")}>
            <label className="classic-editor__property-radio">
              <input
                type="radio"
                checked={draft.settings.answerSubmission === "one-by-one"}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    settings: { ...current.settings, answerSubmission: "one-by-one" },
                  }))
                }
              />
              <span>{t("quiz.propertiesSubmitOneByOne")}</span>
            </label>
            <label className="classic-editor__property-radio">
              <input
                type="radio"
                checked={draft.settings.answerSubmission === "all-at-once"}
                onChange={() =>
                  setDraft((current) => ({
                    ...current,
                    settings: { ...current.settings, answerSubmission: "all-at-once" },
                  }))
                }
              />
              <span>{t("quiz.propertiesSubmitAllAtOnce")}</span>
            </label>

            <div className="classic-editor__property-check-list">
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.settings.showCorrectAnswersAfterSubmission}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        showCorrectAnswersAfterSubmission: event.target.checked,
                      },
                    }))
                  }
                />
                <span>{t("quiz.propertiesShowCorrectAfterSubmit")}</span>
              </label>
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.settings.allowReview}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: { ...current.settings, allowReview: event.target.checked },
                    }))
                  }
                />
                <span>{t("quiz.propertiesAllowReview")}</span>
              </label>
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.settings.oneAttemptOnly}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        oneAttemptOnly: event.target.checked,
                      },
                    }))
                  }
                />
                <span>{t("quiz.propertiesOneAttemptOnly")}</span>
              </label>
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.settings.promptResume}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      settings: { ...current.settings, promptResume: event.target.checked },
                    }))
                  }
                />
                <span>{t("quiz.propertiesPromptResume")}</span>
              </label>
            </div>
          </PropertySection>
    </>
  );
}
