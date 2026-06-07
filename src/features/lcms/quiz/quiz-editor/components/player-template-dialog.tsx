import { useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PreviewIcon from "@mui/icons-material/Preview";

import {
  getQuizThemeStyle,
  resolveQuizTheme,
} from "@/features/lcms/quiz/quiz-theme/theme-catalog";
import { useI18n } from "@/platform/i18n";
import type {
  QuizEditorSlide,
  QuizInformationPage,
  QuizPlayerTemplate,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

type PlayerTemplatePreviewScreen = "info" | "question";

type PlayerTemplateDialogProps = {
  open: boolean;
  selectedThemeId: string;
  value: QuizPlayerTemplate;
  infoPage: QuizInformationPage;
  previewQuestion?: QuizEditorSlide | null;
  questionCount: number;
  passingRate: number;
  onClose: () => void;
  onSave: (themeId: string, nextValue: QuizPlayerTemplate) => void;
};

export function PlayerTemplateDialog({
  open,
  selectedThemeId,
  value,
  infoPage,
  previewQuestion,
  questionCount,
  passingRate,
  onClose,
  onSave,
}: PlayerTemplateDialogProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<QuizPlayerTemplate>(value);
  const [previewScreen, setPreviewScreen] = useState<PlayerTemplatePreviewScreen>("info");

  const resolvedTheme = useMemo(() => resolveQuizTheme(selectedThemeId), [selectedThemeId]);
  const previewChoices = useMemo(() => {
    const choices = previewQuestion?.choices?.map((choice) => choice.label).filter(Boolean);
    if (choices?.length) {
      return choices.slice(0, 4);
    }

    return [
      t("quiz.playerTemplateChoiceA"),
      t("quiz.playerTemplateChoiceB"),
      t("quiz.playerTemplateChoiceC"),
    ];
  }, [previewQuestion, t]);
  const contributors = useMemo(
    () => infoPage.contributors.split(/\r?\n/).filter(Boolean),
    [infoPage.contributors],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="classic-editor__dialog-backdrop" onClick={onClose}>
      <div
        className={cn("classic-editor__dialog", "classic-editor__player-template-dialog")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="classic-editor__dialog-titlebar">
          <div className="classic-editor__dialog-title">
            <PaletteOutlinedIcon className="h-4 w-4 text-[#41688f]" fontSize="inherit" />
            <span>{t("quiz.playerTemplate")}</span>
          </div>
          <button type="button" className="classic-editor__dialog-close" onClick={onClose}>
            <CloseIcon className="h-4 w-4" fontSize="inherit" />
          </button>
        </div>

        <div className="classic-editor__player-template-layout">
          <section className="classic-editor__player-template-themes">
            <div className="classic-editor__property-section-title">{t("common.player")}</div>
            <div className="rounded-lg border border-[#d7e0eb] bg-white px-4 py-4 text-sm leading-6 text-[#526179]">
              {t("quiz.playerTemplate")} hiện dùng một giao diện mặc định thống nhất để giáo viên tập trung vào bố cục, điều hướng và trải nghiệm làm bài.
            </div>
          </section>

          <section className="classic-editor__player-template-sidebar">
            <div className="classic-editor__property-section">
              <div className="classic-editor__property-section-title">{t("quiz.playerTemplatePageSetup")}</div>
              <div className="classic-editor__property-section-body">
                <div className="classic-editor__property-grid is-two">
                  <label className="classic-editor__property-field">
                    <span>{t("quiz.playerTemplateLayout")}</span>
                    <AppSelect
                      value={draft.layout}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          layout: event.target.value as QuizPlayerTemplate["layout"],
                        }))
                      }
                      className="classic-editor__text-input"
                    >
                      <option value="classic">{t("quiz.playerTemplateLayoutClassic")}</option>
                      <option value="focus">{t("quiz.playerTemplateLayoutFocus")}</option>
                      <option value="split">{t("quiz.playerTemplateLayoutSplit")}</option>
                    </AppSelect>
                  </label>

                  <label className="classic-editor__property-field">
                    <span>{t("quiz.playerTemplateSize")}</span>
                    <AppSelect
                      value={draft.playerSize}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          playerSize: event.target.value as QuizPlayerTemplate["playerSize"],
                        }))
                      }
                      className="classic-editor__text-input"
                    >
                      <option value="standard">{t("quiz.playerTemplateSizeStandard")}</option>
                      <option value="wide">{t("quiz.playerTemplateSizeWide")}</option>
                    </AppSelect>
                  </label>
                </div>

                <div className="classic-editor__property-grid is-two">
                  <label className="classic-editor__property-field">
                    <span>{t("quiz.playerTemplateAccentColor")}</span>
                    <input
                      type="color"
                      value={draft.accentColor}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, accentColor: event.target.value }))
                      }
                      className="classic-editor__player-color"
                    />
                  </label>
                  <label className="classic-editor__property-field">
                    <span>{t("quiz.playerTemplateHighlightColor")}</span>
                    <input
                      type="color"
                      value={draft.highlightColor}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, highlightColor: event.target.value }))
                      }
                      className="classic-editor__player-color"
                    />
                  </label>
                </div>

                <div className="classic-editor__property-check-list">
                  <label className="classic-editor__property-check">
                    <input
                      type="checkbox"
                      checked={draft.showToolbar}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, showToolbar: event.target.checked }))
                      }
                    />
                    <span>{t("quiz.playerTemplateToolbar")}</span>
                  </label>
                  <label className="classic-editor__property-check">
                    <input
                      type="checkbox"
                      checked={draft.showPanel}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, showPanel: event.target.checked }))
                      }
                    />
                    <span>{t("quiz.playerTemplatePanel")}</span>
                  </label>
                  <label className="classic-editor__property-check">
                    <input
                      type="checkbox"
                      checked={draft.roundedCorners}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          roundedCorners: event.target.checked,
                        }))
                      }
                    />
                    <span>{t("quiz.playerTemplateRoundedCorners")}</span>
                  </label>
                  <label className="classic-editor__property-check">
                    <input
                      type="checkbox"
                      checked={draft.rolledPaper}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, rolledPaper: event.target.checked }))
                      }
                    />
                    <span>{t("quiz.playerTemplateRolledPaper")}</span>
                  </label>
                  <label className="classic-editor__property-check">
                    <input
                      type="checkbox"
                      checked={draft.textLabels}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, textLabels: event.target.checked }))
                      }
                    />
                    <span>{t("quiz.playerTemplateTextLabels")}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="classic-editor__property-section">
              <div className="classic-editor__property-section-title">
                <span>{t("common.preview")}</span>
                <div className="classic-editor__player-preview-tabs">
                  <button
                    type="button"
                    className={cn(previewScreen === "info" && "is-active")}
                    onClick={() => setPreviewScreen("info")}
                  >
                    {t("common.introduction")}
                  </button>
                  <button
                    type="button"
                    className={cn(previewScreen === "question" && "is-active")}
                    onClick={() => setPreviewScreen("question")}
                  >
                    {t("common.question")}
                  </button>
                </div>
              </div>
              <div className="classic-editor__player-preview">
                <div
                  className={cn(
                    "classic-editor__player-preview-shell",
                    draft.roundedCorners && "is-rounded",
                    draft.playerSize === "wide" && "is-wide",
                  )}
                  style={{
                    background: resolvedTheme.pageBackground,
                    borderColor: resolvedTheme.canvasBorder,
                  }}
                >
                  <div
                    className={cn(
                      "classic-editor__player-preview-page",
                      "classic-editor__student-player-preview",
                      !draft.showPanel && "is-no-panel",
                    )}
                    style={getQuizThemeStyle(resolvedTheme)}
                  >
                    <section
                      className={cn("classic-editor__student-preview-main", draft.rolledPaper && "is-rolled-paper")}
                      style={{
                        background: resolvedTheme.playerBackground,
                        borderColor: resolvedTheme.canvasBorder,
                      }}
                    >
                      {draft.showToolbar ? (
                        <div className="classic-editor__student-preview-resource">
                          <span>Tài nguyên</span>
                          {previewScreen === "question" ? (
                            <>
                              <i />
                              <span>{`Câu 1 / ${Math.max(questionCount, 1)}`}</span>
                            </>
                          ) : null}
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          "classic-editor__student-preview-canvas",
                          previewScreen === "info" ? "is-info" : "is-question",
                        )}
                        style={{
                          borderColor: resolvedTheme.canvasBorder,
                          background: resolvedTheme.playerBackground,
                        }}
                      >
                        {previewScreen === "info" ? (
                          <div className="classic-editor__student-preview-info">
                            <div className="classic-editor__student-preview-info-copy">
                              <strong style={{ color: resolvedTheme.accentStart }}>{infoPage.courseTitle}</strong>
                              <h2 style={{ color: resolvedTheme.accentEnd }}>{infoPage.lessonTitle}</h2>
                              <p style={{ color: resolvedTheme.optionText }}>
                                Bấm &quot;{infoPage.startButtonLabel}&quot; để bắt đầu làm bài.
                              </p>
                              <div className="classic-editor__student-preview-badges">
                                <span style={{ background: resolvedTheme.optionSelectedBackground, color: resolvedTheme.accentStart }}>
                                  CHẾ ĐỘ LUYỆN TẬP
                                </span>
                                <span>Xem đáp án từng câu và tự động sang câu tiếp theo</span>
                              </div>
                              <ul style={{ color: resolvedTheme.optionText }}>
                                <li>Lecture: {infoPage.lecturer}</li>
                                {contributors.slice(0, 3).map((name, index) => (
                                  <li key={`${name}-${index}`}>{name}</li>
                                ))}
                              </ul>
                            </div>

                            <div
                              className="classic-editor__student-preview-hero-card"
                              style={{ backgroundColor: resolvedTheme.accentStart }}
                            >
                              <div>
                                <span style={{ color: resolvedTheme.accentStart }}>LUYỆN TẬP</span>
                                <strong style={{ color: resolvedTheme.accentEnd }}>{infoPage.testTitle}</strong>
                                <small>{infoPage.version}</small>
                              </div>
                              <i />
                              <b />
                            </div>
                          </div>
                        ) : (
                          <div className="classic-editor__student-preview-question">
                            <div
                              className="classic-editor__student-preview-question-title"
                              style={{ background: resolvedTheme.headerBackground, color: resolvedTheme.headerText }}
                            >
                              {previewQuestion?.title || t("quiz.playerTemplatePreviewQuestion")}
                            </div>
                            <div className="classic-editor__student-preview-question-body">
                              <div
                                className="classic-editor__player-preview-banner"
                                style={{ background: draft.accentColor }}
                              />
                              <div className="classic-editor__player-preview-options">
                                {previewChoices.map((choice) => (
                                  <div
                                    key={choice}
                                    className="classic-editor__player-preview-option"
                                    style={{
                                      background: resolvedTheme.inputBackground,
                                      borderColor: resolvedTheme.canvasBorder,
                                      color: resolvedTheme.optionText,
                                    }}
                                  >
                                    <span
                                      className="classic-editor__player-preview-dot"
                                      style={{ background: draft.highlightColor }}
                                    />
                                    <span>{choice}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="classic-editor__student-preview-footer">
                        <span>
                          {previewScreen === "info"
                            ? "Luyện tập: xem đáp án từng câu"
                            : `${t("quiz.showPassingScore")}: ${passingRate}%`}
                        </span>
                        <button type="button" style={{ background: resolvedTheme.sidebarActiveBackground }}>
                          {previewScreen === "info" ? infoPage.startButtonLabel : "TIẾP TỤC"}
                        </button>
                      </div>
                    </section>

                    {draft.showPanel ? (
                      <aside
                        className="classic-editor__student-preview-sidebar"
                        style={{
                          background: resolvedTheme.playerBackground,
                          borderColor: resolvedTheme.canvasBorder,
                        }}
                      >
                        <div className="classic-editor__student-preview-sidebar-tabs">
                          <button type="button" className="is-active" style={{ background: resolvedTheme.sidebarActiveBackground }}>
                            MỤC LỤC
                          </button>
                          <button type="button">GHI CHÚ</button>
                        </div>
                        <div className="classic-editor__student-preview-search">
                          <span>Tìm kiếm</span>
                          <i>⌕</i>
                        </div>
                        <div className="classic-editor__student-preview-outline">
                          <button
                            type="button"
                            className={cn("classic-editor__student-preview-outline-item", previewScreen === "info" && "is-active")}
                            onClick={() => setPreviewScreen("info")}
                          >
                            <span className="is-thumb" />
                            <strong>1. Trang giới thiệu</strong>
                            <small>{infoPage.courseTitle}</small>
                          </button>
                          {[1, 2, 3, 4, 5].map((number) => (
                            <button
                              key={number}
                              type="button"
                              className={cn(
                                "classic-editor__student-preview-outline-item",
                                number === 1 && previewScreen === "question" && "is-active",
                              )}
                              onClick={() => setPreviewScreen("question")}
                            >
                              <span
                                className="is-number"
                                style={number === 1 && previewScreen === "question" ? undefined : { color: resolvedTheme.accentStart }}
                              >
                                {number}
                              </span>
                              <strong>
                                {number}. {number === 1 ? previewQuestion?.title || t("common.question") : "Câu hỏi trong bài kiểm tra..."}
                              </strong>
                              <small>{number === 1 ? "Chọn 1 đáp án" : "Chọn vị trí trên ảnh"}</small>
                            </button>
                          ))}
                        </div>
                      </aside>
                    ) : null}
                  </div>
                </div>
                <div className="classic-editor__student-preview-screen-tabs">
                  <button
                    type="button"
                    className={cn(previewScreen === "info" && "is-active")}
                    onClick={() => setPreviewScreen("info")}
                  >
                    {t("common.introduction")}
                  </button>
                  <button
                    type="button"
                    className={cn(previewScreen === "question" && "is-active")}
                    onClick={() => setPreviewScreen("question")}
                  >
                    {t("common.question")}
                  </button>
                </div>
                <div className="classic-editor__player-preview-legend">
                  <span>
                    <i style={{ background: resolvedTheme.pageBackground }} />
                    Page
                  </span>
                  <span>
                    <i style={{ background: resolvedTheme.playerBackground }} />
                    Player
                  </span>
                  <span>
                    <i style={{ background: draft.accentColor }} />
                    Accent
                  </span>
                </div>

                <div className="classic-editor__player-preview-meta">
                  <PreviewIcon className="h-4 w-4 text-[#5c7da5]" fontSize="inherit" />
                  <span>
                    {draft.soundEffect === "subtle"
                      ? t("quiz.playerTemplateSoundOn")
                      : t("quiz.playerTemplateSoundOff")}{" "}
                    /{" "}
                    {draft.textLabels
                      ? t("quiz.playerTemplateLabelsVisible")
                      : t("quiz.playerTemplateLabelsHidden")}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="classic-editor__dialog-actions">
          <div className="classic-editor__dialog-action-group">
            <button
              type="button"
              className="classic-editor__dialog-primary"
              onClick={() => {
                onSave(selectedThemeId, draft);
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
