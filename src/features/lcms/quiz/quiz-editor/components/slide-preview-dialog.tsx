import { useMemo, useState } from "react";
import { CheckCircle2 as CheckCircleOutlinedIcon } from "@/components/mui-icon-shim";
import { ChevronLeft as ChevronLeftIcon } from "@/components/mui-icon-shim";
import { ChevronRight as ChevronRightIcon } from "@/components/mui-icon-shim";
import { UploadCloud as CloudUploadIcon } from "@/components/mui-icon-shim";
import { X as CloseIcon } from "@/components/mui-icon-shim";
import { Download as DownloadIcon } from "@/components/mui-icon-shim";
import { Play as PlayArrowIcon } from "@/components/mui-icon-shim";

import { LearnerQuestionAuthoringPreview } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview";
import { QuizEditorSlideRender } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-slide-render";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

export type SlidePreviewDialogMode = "preview" | "player" | "publish";
type LearnerReviewMode = "question" | "correct" | "incorrect";

export function SlidePreviewDialog({
  open,
  mode,
  slides,
  selectedSlideId,
  selectedThemeId,
  exportPayload,
  onClose,
}: {
  open: boolean;
  mode: SlidePreviewDialogMode;
  slides: QuizEditorSlide[];
  selectedSlideId?: string | null;
  selectedThemeId: string;
  exportPayload: object;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const initialIndex = Math.max(
    slides.findIndex((slide) => slide.id === selectedSlideId),
    0,
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [reviewMode, setReviewMode] = useState<LearnerReviewMode>("question");
  const currentSlide = slides[currentIndex] ?? slides[0] ?? null;
  const isPublishMode = mode === "publish";
  const isPlayerMode = mode === "player";
  const hasReviewLayer = currentSlide
    ? currentSlide.kind !== "result-slide" &&
      currentSlide.kind !== "instruction-slide" &&
      currentSlide.kind !== "intro-slide" &&
      currentSlide.kind !== "info-slide" &&
      Boolean(currentSlide.feedbackRows?.length)
    : false;
  const visibleReviewMode = hasReviewLayer ? reviewMode : "question";

  const title = useMemo(() => {
    if (mode === "preview") return t("common.preview");
    if (mode === "player") return t("common.player");
    return t("common.publish");
  }, [mode, t]);

  if (!open || !currentSlide) {
    return null;
  }

  return (
    <div className="classic-editor__dialog-backdrop" onClick={onClose}>
      <div
        className={cn(
          "classic-editor__dialog",
          "classic-editor__slide-preview-dialog",
          isPlayerMode && "is-player",
          isPublishMode && "is-publish",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="classic-editor__dialog-titlebar">
          <div className="classic-editor__dialog-title">
            {isPublishMode ? <CloudUploadIcon className="h-4 w-4 text-[#4a79b1]" size="1em" /> : <PlayArrowIcon className="h-4 w-4 text-[#4a79b1]" size="1em" />}
            <span>{title}</span>
          </div>
          <button type="button" className="classic-editor__dialog-close" onClick={onClose}>
            <CloseIcon className="h-4 w-4" size="1em" />
          </button>
        </div>

        {isPublishMode ? (
          <PublishSummary
            slides={slides}
            selectedThemeId={selectedThemeId}
            currentSlide={currentSlide}
            exportPayload={exportPayload}
          />
        ) : (
          <div className="classic-editor__slide-preview-shell-body">
            {isPlayerMode ? (
              <aside className="classic-editor__slide-preview-sidebar">
                <div className="classic-editor__slide-preview-sidebar-title">{t("player.outline")}</div>
                <div className="classic-editor__slide-preview-sidebar-list">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => {
                        setReviewMode("question");
                        setCurrentIndex(index);
                      }}
                      className={cn("classic-editor__slide-preview-sidebar-item", index === currentIndex && "is-active")}
                    >
                      <span>{index + 1}.</span>
                      <span>{slide.title}</span>
                    </button>
                  ))}
                </div>
              </aside>
            ) : null}

            <div className="classic-editor__slide-preview-stage-wrap">
              <div className="classic-editor__slide-preview-stage-toolbar">
                <button
                  type="button"
                  className="classic-editor__dialog-secondary"
                  onClick={() => {
                    setReviewMode("question");
                    setCurrentIndex((value) => Math.max(0, value - 1));
                  }}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeftIcon className="h-4 w-4" size="1em" />
                </button>
                <span className="classic-editor__slide-preview-stage-label">
                  {currentIndex + 1}/{slides.length} - {currentSlide.title}
                </span>
                <button
                  type="button"
                  className="classic-editor__dialog-secondary"
                  onClick={() => {
                    setReviewMode("question");
                    setCurrentIndex((value) => Math.min(slides.length - 1, value + 1));
                  }}
                  disabled={currentIndex === slides.length - 1}
                >
                  <ChevronRightIcon className="h-4 w-4" size="1em" />
                </button>

                <div className="classic-editor__slide-preview-review-tabs">
                  <button
                    type="button"
                    className={cn("classic-editor__slide-preview-review-tab", visibleReviewMode === "question" && "is-active")}
                    onClick={() => setReviewMode("question")}
                  >
                    {t("quiz.questionScreen")}
                  </button>
                  {hasReviewLayer ? (
                    <>
                      <button
                        type="button"
                        className={cn("classic-editor__slide-preview-review-tab", visibleReviewMode === "correct" && "is-active")}
                        onClick={() => setReviewMode("correct")}
                      >
                        {t("quiz.correctFeedbackScreen")}
                      </button>
                      <button
                        type="button"
                        className={cn("classic-editor__slide-preview-review-tab", visibleReviewMode === "incorrect" && "is-active")}
                        onClick={() => setReviewMode("incorrect")}
                      >
                        {t("quiz.incorrectFeedbackScreen")}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="classic-editor__slide-preview-stage">
                <LearnerQuestionAuthoringPreview
                  slide={currentSlide}
                  themeId={selectedThemeId}
                  previewMode={visibleReviewMode}
                  readOnly
                  onUpdateTitle={() => undefined}
                  onUpdateInstructions={() => undefined}
                />
              </div>
            </div>
          </div>
        )}

        <div className="classic-editor__dialog-actions">
          <div className="classic-editor__dialog-action-group">
            {isPublishMode ? (
              <button
                type="button"
                className="classic-editor__dialog-primary"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "quiz-project-export.json";
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <DownloadIcon className="h-4 w-4" size="1em" />
                <span>{t("quiz.exportJson")}</span>
              </button>
            ) : (
              <button type="button" className="classic-editor__dialog-primary" onClick={onClose}>
                <CheckCircleOutlinedIcon className="h-4 w-4" size="1em" />
                <span>{t("common.done")}</span>
              </button>
            )}
            <button type="button" className="classic-editor__dialog-secondary" onClick={onClose}>
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublishSummary({
  slides,
  currentSlide,
  selectedThemeId,
  exportPayload,
}: {
  slides: QuizEditorSlide[];
  currentSlide: QuizEditorSlide;
  selectedThemeId: string;
  exportPayload: object;
}) {
  const { t } = useI18n();
  const summary = JSON.stringify(exportPayload, null, 2);

  return (
    <div className="classic-editor__slide-publish-grid">
      <div className="classic-editor__slide-publish-card">
        <div className="classic-editor__slide-publish-metrics">
          <div>
            <strong>{slides.length}</strong>
            <span>{t("quiz.previewSlidesMetric")}</span>
          </div>
          <div>
            <strong>{slides.filter((slide) => isQuestionType(slide.kind)).length}</strong>
            <span>{t("quiz.previewQuestionsMetric")}</span>
          </div>
          <div>
            <strong>{selectedThemeId}</strong>
            <span>{t("quiz.previewThemeMetric")}</span>
          </div>
        </div>
        <div className="classic-editor__slide-publish-preview">
          <QuizEditorSlideRender slide={currentSlide} size="mini" themeId={selectedThemeId} />
        </div>
      </div>
      <pre className="classic-editor__slide-publish-json">{summary}</pre>
    </div>
  );
}
