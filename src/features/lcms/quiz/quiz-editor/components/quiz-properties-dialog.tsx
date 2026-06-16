import { useState } from "react";
import { X as CloseIcon } from "@/components/mui-icon-shim";
import { LineChart as InsightsOutlinedIcon } from "@/components/mui-icon-shim";
import { Lock as LockOutlinedIcon } from "@/components/mui-icon-shim";
import { HelpCircle as QuizOutlinedIcon } from "@/components/mui-icon-shim";
import { Settings as SettingsOutlinedIcon } from "@/components/mui-icon-shim";
import { Sliders as TuneOutlinedIcon } from "@/components/mui-icon-shim";

import { resolveQuizFontStack } from "@/config/fonts";
import {
  informationThemeOptions,
  PropertyField,
  PropertySection,
  QuizInformationPreview,
  QuizResultPreview,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import { quizEditorFontOptions } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import {
  getQuizThemePreset,
  getQuizThemeStyle,
} from "@/features/lcms/quiz/quiz-theme";
import { useI18n } from "@/platform/i18n";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

type QuizPropertiesDialogProps = {
  open: boolean;
  value: QuizProjectSettings;
  initialTab?: QuizPropertiesTab;
  selectedThemeId: string;
  onClose: () => void;
  onSave: (nextValue: QuizProjectSettings) => void;
};

export type QuizPropertiesTab =
  | "quiz-information"
  | "quiz-settings"
  | "quiz-result"
  | "question-settings"
  | "others";

const tabIcons: Record<QuizPropertiesTab, typeof QuizOutlinedIcon> = {
  "quiz-information": QuizOutlinedIcon,
  "quiz-settings": SettingsOutlinedIcon,
  "quiz-result": InsightsOutlinedIcon,
  "question-settings": TuneOutlinedIcon,
  others: LockOutlinedIcon,
};

export function QuizPropertiesDialog({
  open,
  value,
  initialTab,
  selectedThemeId,
  onClose,
  onSave,
}: QuizPropertiesDialogProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<QuizPropertiesTab>(initialTab ?? "quiz-information");
  const [draft, setDraft] = useState<QuizProjectSettings>(value);

  if (!open) {
    return null;
  }

  return (
    <div className="classic-editor__dialog-backdrop" onClick={onClose}>
      <div
        className={cn("classic-editor__dialog", "classic-editor__property-dialog")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="classic-editor__dialog-titlebar">
          <div className="classic-editor__dialog-title">
            <SettingsOutlinedIcon className="h-4 w-4 text-[#41688f]" size="1em" />
            <span>{t("quiz.quizProperties")}</span>
          </div>
          <button type="button" className="classic-editor__dialog-close" onClick={onClose}>
            <CloseIcon className="h-4 w-4" size="1em" />
          </button>
        </div>

        <div className="classic-editor__property-layout">
          <aside className="classic-editor__property-sidebar">
            {(Object.keys(tabIcons) as QuizPropertiesTab[]).map((tabId) => {
              const Icon = tabIcons[tabId];

              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={cn("classic-editor__property-tab", activeTab === tabId && "is-active")}
                >
                  <Icon className="h-4 w-4" size="1em" />
                  <span>{t(getTabLabelKey(tabId))}</span>
                </button>
              );
            })}
          </aside>

          <div className="classic-editor__property-panel">
            {activeTab === "quiz-information" ? (
              <div
                className="classic-editor__intro-designer-layout"
                style={getQuizThemeStyle(getQuizThemePreset(selectedThemeId).theme)}
              >
                <div className="classic-editor__intro-designer-toolbar">
                  <div className="classic-editor__intro-player-theme-note">
                    <div>
                      <strong>Player surface</strong>
                      <span>Đang dùng giao diện mặc định thống nhất.</span>
                    </div>
                  </div>

                  <PropertySection title="Intro layout">
                    <div className="classic-editor__intro-theme-grid">
                      {informationThemeOptions.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={cn(
                            "classic-editor__intro-theme-card",
                            `is-${theme.id}`,
                            draft.info.page.theme === theme.id && "is-active",
                          )}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              info: {
                                ...current.info,
                                page: { ...current.info.page, theme: theme.id },
                              },
                            }))
                          }
                        >
                          <span className="classic-editor__intro-theme-swatch">
                            <span />
                            <span />
                            <span />
                          </span>
                          <strong>{theme.label}</strong>
                          <small>{theme.description}</small>
                        </button>
                      ))}
                    </div>
                  </PropertySection>
                </div>

                <QuizInformationPreview
                  value={draft}
                  selectedThemeId={selectedThemeId}
                  onChange={(patch) =>
                    setDraft((current) => ({
                      ...current,
                      info: { ...current.info, ...patch },
                    }))
                  }
                />

                <div className="classic-editor__intro-designer-fields">

                  <PropertySection title={t("quiz.propertiesSectionInformation")}>
                    <PropertyField label={t("quiz.propertiesQuizTitle")}>
                      <input
                        value={draft.info.title}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: { ...current.info, title: event.target.value },
                          }))
                        }
                        className="classic-editor__text-input"
                      />
                    </PropertyField>

                    <PropertyField label={t("common.author")}>
                      <input
                        value={draft.info.author}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: { ...current.info, author: event.target.value },
                          }))
                        }
                        className="classic-editor__text-input"
                      />
                    </PropertyField>
                  </PropertySection>

                  <PropertySection title={t("common.introduction")}>
                    <div className="classic-editor__property-grid is-two">
                      <PropertyField label="Course">
                        <input
                          value={draft.info.page.courseTitle}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              info: {
                                ...current.info,
                                page: { ...current.info.page, courseTitle: event.target.value },
                              },
                            }))
                          }
                          className="classic-editor__text-input"
                        />
                      </PropertyField>

                      <PropertyField label="Test">
                        <input
                          value={draft.info.page.testTitle}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              info: {
                                ...current.info,
                                page: { ...current.info.page, testTitle: event.target.value },
                              },
                            }))
                          }
                          className="classic-editor__text-input"
                        />
                      </PropertyField>
                    </div>

                    <PropertyField label="Lesson">
                      <input
                        value={draft.info.page.lessonTitle}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: {
                              ...current.info,
                              page: { ...current.info.page, lessonTitle: event.target.value },
                            },
                          }))
                        }
                        className="classic-editor__text-input"
                      />
                    </PropertyField>

                    <PropertyField label="Lecturer">
                      <input
                        value={draft.info.page.lecturer}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: {
                              ...current.info,
                              page: { ...current.info.page, lecturer: event.target.value },
                            },
                          }))
                        }
                        className="classic-editor__text-input"
                      />
                    </PropertyField>

                    <label className="classic-editor__property-check">
                      <input
                        type="checkbox"
                        checked={draft.info.showIntroductionPage}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: { ...current.info, showIntroductionPage: event.target.checked },
                          }))
                        }
                      />
                      <span>{t("quiz.propertiesDisplayIntroductionPage")}</span>
                    </label>

                    <textarea
                      value={draft.info.page.contributors}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          info: {
                            ...current.info,
                            page: { ...current.info.page, contributors: event.target.value },
                          },
                        }))
                      }
                      className="classic-editor__textarea classic-editor__property-textarea"
                      aria-label="Contributors"
                      rows={6}
                    />

                    <label className="classic-editor__property-check">
                      <input
                        type="checkbox"
                        checked={draft.info.showQuizStatistics}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            info: { ...current.info, showQuizStatistics: event.target.checked },
                          }))
                        }
                      />
                      <span>{t("quiz.propertiesDisplayQuizStatistics")}</span>
                    </label>
                  </PropertySection>
                </div>
              </div>
            ) : null}

            {activeTab === "quiz-settings" ? (
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
            ) : null}

            {activeTab === "quiz-result" ? (
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
            ) : null}

            {activeTab === "question-settings" ? (
              <>
                <PropertySection title={t("quiz.propertiesSectionQuestionDefaults")}>
                  <div className="classic-editor__property-grid is-two">
                    <PropertyField label={t("quiz.propertiesPositivePoints")}>
                      <input
                        type="number"
                        value={draft.questionDefaults.positivePoints}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questionDefaults: {
                              ...current.questionDefaults,
                              positivePoints: Number(event.target.value),
                            },
                          }))
                        }
                        className="classic-editor__property-number"
                      />
                    </PropertyField>
                    <PropertyField label={t("quiz.propertiesNegativePoints")}>
                      <input
                        type="number"
                        value={draft.questionDefaults.negativePoints}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            questionDefaults: {
                              ...current.questionDefaults,
                              negativePoints: Number(event.target.value),
                            },
                          }))
                        }
                        className="classic-editor__property-number"
                      />
                    </PropertyField>
                  </div>

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
            ) : null}

            {activeTab === "others" ? (
              <>
                <PropertySection title={t("quiz.propertiesSectionPasswordProtection")}>
                  <label className="classic-editor__property-radio">
                    <input
                      type="radio"
                      checked={draft.others.passwordMode === "none"}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, passwordMode: "none" },
                        }))
                      }
                    />
                    <span>{t("quiz.propertiesNoProtection")}</span>
                  </label>
                  <label className="classic-editor__property-radio">
                    <input
                      type="radio"
                      checked={draft.others.passwordMode === "password"}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, passwordMode: "password" },
                        }))
                      }
                    />
                    <span>{t("quiz.propertiesPasswordOnly")}</span>
                  </label>
                  <label className="classic-editor__property-radio">
                    <input
                      type="radio"
                      checked={draft.others.passwordMode === "user-password"}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, passwordMode: "user-password" },
                        }))
                      }
                    />
                    <span>{t("quiz.propertiesUserPassword")}</span>
                  </label>
                  <PropertyField label={t("common.password")}>
                    <input
                      value={draft.others.password}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, password: event.target.value },
                        }))
                      }
                      className="classic-editor__text-input"
                      disabled={draft.others.passwordMode === "none"}
                    />
                  </PropertyField>
                </PropertySection>

                <PropertySection title={t("quiz.propertiesSectionDomainLimit")}>
                  <PropertyField label={t("quiz.propertiesDomain")}>
                    <input
                      value={draft.others.domain}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, domain: event.target.value },
                        }))
                      }
                      className="classic-editor__text-input"
                    />
                  </PropertyField>
                </PropertySection>

                <PropertySection title={t("quiz.propertiesSectionPageMeta")}>
                  <PropertyField label={t("common.description")}>
                    <textarea
                      value={draft.others.metaDescription}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, metaDescription: event.target.value },
                        }))
                      }
                      className="classic-editor__textarea classic-editor__property-textarea"
                      rows={4}
                    />
                  </PropertyField>
                  <PropertyField label={t("common.keywords")}>
                    <input
                      value={draft.others.metaKeywords}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          others: { ...current.others, metaKeywords: event.target.value },
                        }))
                      }
                      className="classic-editor__text-input"
                    />
                  </PropertyField>
                </PropertySection>
              </>
            ) : null}
          </div>
        </div>

        <div className="classic-editor__dialog-actions">
          <div className="classic-editor__dialog-action-group">
            <button
              type="button"
              className="classic-editor__dialog-primary"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              {t("common.apply")}
            </button>
            <button type="button" className="classic-editor__dialog-secondary" onClick={onClose}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTabLabelKey(tab: QuizPropertiesTab) {
  switch (tab) {
    case "quiz-information":
      return "quiz.propertiesTabInformation";
    case "quiz-settings":
      return "quiz.propertiesTabSettings";
    case "quiz-result":
      return "quiz.propertiesTabResult";
    case "question-settings":
      return "quiz.propertiesTabQuestionDefaults";
    case "others":
      return "quiz.propertiesTabOthers";
  }
}
