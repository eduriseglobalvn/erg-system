import type { Dispatch, SetStateAction } from "react";
import { resolveQuizFontStack } from "@/config/fonts";
import { AppSelect } from "@/components/erg-mui/app-select";
import { quizEditorFontOptions } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { PropertyField, PropertySection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";

export type QuestionDefaultsSectionProps = {
  draft: QuizProjectSettings;
  setDraft: Dispatch<SetStateAction<QuizProjectSettings>>;
};

export function QuestionDefaultsSection({ draft, setDraft }: QuestionDefaultsSectionProps) {
  const { t } = useI18n();

  return (
    <>
          <PropertySection title={t("quiz.propertiesSectionQuestionDefaults")}>
            <div className="classic-editor__property-check-list">
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.questionDefaults.shuffleAnswers}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      questionDefaults: {
                        ...current.questionDefaults,
                        shuffleAnswers: event.target.checked,
                      },
                    }))
                  }
                />
                <span>{t("quiz.propertiesShuffleAnswers")}</span>
              </label>
              <label className="classic-editor__property-check">
                <input
                  type="checkbox"
                  checked={draft.questionDefaults.shuffleQuestions}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      questionDefaults: {
                        ...current.questionDefaults,
                        shuffleQuestions: event.target.checked,
                      },
                    }))
                  }
                />
                <span>{t("quiz.propertiesShuffleQuestions")}</span>
              </label>
            </div>
          </PropertySection>

          <PropertySection title={t("quiz.propertiesSectionFontDefaults")}>
            <div className="classic-editor__property-grid is-two">
              <PropertyField label={t("quiz.propertiesQuestionFont")}>
                <AppSelect
                  value={draft.questionDefaults.questionFont}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      questionDefaults: {
                        ...current.questionDefaults,
                        questionFont: event.target.value,
                      },
                    }))
                  }
                  className="classic-editor__text-input"
                  style={{ fontFamily: resolveQuizFontStack(draft.questionDefaults.questionFont) }}
                >
                  {quizEditorFontOptions.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: resolveQuizFontStack(font) }}>
                      {font}
                    </option>
                  ))}
                </AppSelect>
              </PropertyField>
              <PropertyField label={t("quiz.propertiesAnswerFont")}>
                <AppSelect
                  value={draft.questionDefaults.answerFont}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      questionDefaults: {
                        ...current.questionDefaults,
                        answerFont: event.target.value,
                      },
                    }))
                  }
                  className="classic-editor__text-input"
                  style={{ fontFamily: resolveQuizFontStack(draft.questionDefaults.answerFont) }}
                >
                  {quizEditorFontOptions.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: resolveQuizFontStack(font) }}>
                      {font}
                    </option>
                  ))}
                </AppSelect>
              </PropertyField>
            </div>
          </PropertySection>

          <PropertySection title={t("quiz.propertiesSectionDefaultFeedback")}>
            <PropertyField label={t("quiz.propertiesCorrectFeedback")}>
              <textarea
                value={draft.questionDefaults.correctFeedback}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    questionDefaults: {
                      ...current.questionDefaults,
                      correctFeedback: event.target.value,
                    },
                  }))
                }
                className="classic-editor__textarea classic-editor__property-textarea"
                rows={4}
              />
            </PropertyField>
            <PropertyField label={t("quiz.propertiesIncorrectFeedback")}>
              <textarea
                value={draft.questionDefaults.incorrectFeedback}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    questionDefaults: {
                      ...current.questionDefaults,
                      incorrectFeedback: event.target.value,
                    },
                  }))
                }
                className="classic-editor__textarea classic-editor__property-textarea"
                rows={4}
              />
            </PropertyField>
          </PropertySection>
    </>
  );
}
