import type { ReactNode } from "react";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

import {
  getQuizThemePreset,
  getQuizThemeStyle,
} from "@/features/lcms/quiz/quiz-theme";
import { useI18n } from "@/platform/i18n";
import type {
  QuizInformationPage,
  QuizInformationTheme,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

export const informationThemeOptions: Array<{
  id: QuizInformationTheme;
  label: string;
  description: string;
}> = [
  {
    id: "academic-wave",
    label: "Wave intro",
    description: "Course title, accent ribbons, presenter list.",
  },
  {
    id: "corporate-frame",
    label: "Framed intro",
    description: "Organization header and formal framed style.",
  },
  {
    id: "creative-student",
    label: "Visual intro",
    description: "Large visual area with a clear start zone.",
  },
  {
    id: "minimal-focus",
    label: "Focus intro",
    description: "Centered, quiet layout for formal tests.",
  },
];

export function PropertySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="classic-editor__property-section">
      <div className="classic-editor__property-section-title">{title}</div>
      <div className="classic-editor__property-section-body">{children}</div>
    </section>
  );
}

export function QuizInformationPreview({
  value,
  selectedThemeId,
  onChange,
}: {
  value: QuizProjectSettings;
  selectedThemeId: string;
  onChange: (patch: Partial<QuizProjectSettings["info"]>) => void;
}) {
  const { t } = useI18n();
  const page = value.info.page;
  const theme = getQuizThemePreset(selectedThemeId);
  const contributors = page.contributors.split(/\r?\n/).filter(Boolean);

  function updatePage(patch: Partial<QuizInformationPage>) {
    onChange({ page: { ...page, ...patch } });
  }

  return (
    <section
      className={cn("classic-editor__property-live-preview", "is-intro-designer", `is-${page.theme}`)}
      aria-live="polite"
      style={getQuizThemeStyle(theme.theme)}
    >
      <div className="classic-editor__property-preview-titlebar">
        <span>{t("quiz.propertiesTabInformation")}</span>
        <strong>
          {theme.name} - {informationThemeOptions.find((option) => option.id === page.theme)?.label}
        </strong>
      </div>

      <div className="classic-editor__property-info-preview">
        <div className="classic-editor__property-player-top">
          <input
            value={page.organization}
            onChange={(event) => updatePage({ organization: event.target.value })}
            aria-label="Organization"
          />
          <input
            value={page.version}
            onChange={(event) => updatePage({ version: event.target.value })}
            aria-label="Version"
          />
        </div>

        <div className="classic-editor__property-info-stage">
          <div className="classic-editor__intro-art" aria-hidden="true">
            <span className="classic-editor__intro-art-line is-a" />
            <span className="classic-editor__intro-art-line is-b" />
            <span className="classic-editor__intro-art-circle is-a" />
            <span className="classic-editor__intro-art-circle is-b" />
            <span className="classic-editor__intro-person">
              <span />
              <span />
              <span />
            </span>
          </div>

          <div className="classic-editor__intro-content">
            <input
              value={page.courseTitle}
              onChange={(event) => updatePage({ courseTitle: event.target.value })}
              className="classic-editor__intro-course-input"
              aria-label="Course title"
            />
            <textarea
              value={page.lessonTitle}
              rows={2}
              onChange={(event) => updatePage({ lessonTitle: event.target.value })}
              className="classic-editor__intro-lesson-input"
              aria-label="Lesson title"
            />
            <input
              value={page.testTitle}
              onChange={(event) => updatePage({ testTitle: event.target.value })}
              className="classic-editor__intro-test-input"
              aria-label="Test title"
            />
            <div className="classic-editor__intro-accent-rule" />

            <label className="classic-editor__intro-lecturer">
              <span>Lecturer:</span>
              <input
                value={page.lecturer}
                onChange={(event) => updatePage({ lecturer: event.target.value })}
                aria-label="Lecturer"
              />
            </label>

            <div className="classic-editor__intro-contributors">
              {contributors.length ? (
                contributors.map((contributor, index) => (
                  <div key={`${contributor}-${index}`}>
                    <span />
                    <input
                      value={contributor}
                      onChange={(event) => {
                        const nextContributors = [...contributors];
                        nextContributors[index] = event.target.value;
                        updatePage({ contributors: nextContributors.join("\n") });
                      }}
                      aria-label={`Contributor ${index + 1}`}
                    />
                  </div>
                ))
              ) : (
                <div>
                  <span />
                  <input
                    value=""
                    onChange={(event) => updatePage({ contributors: event.target.value })}
                    aria-label="Contributor"
                    placeholder="Contributor"
                  />
                </div>
              )}
            </div>

            <textarea
              value={value.info.introduction}
              rows={2}
              disabled={!value.info.showIntroductionPage}
              onChange={(event) => onChange({ introduction: event.target.value })}
              className="classic-editor__intro-note-input"
              aria-label={t("common.introduction")}
            />
          </div>

          {value.info.showQuizStatistics ? (
            <div className="classic-editor__property-stat-row">
              <span>{t("quiz.previewQuestionsMetric")}: 24</span>
              <span>{t("quiz.propertiesPassingRate")}: 80%</span>
            </div>
          ) : null}

          <div className="classic-editor__intro-start-row">
            <input
              value={page.startButtonLabel}
              onChange={(event) => updatePage({ startButtonLabel: event.target.value })}
              aria-label="Start button label"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuizResultPreview({
  value,
}: {
  value: QuizProjectSettings;
}) {
  const { t } = useI18n();
  const themePreset = getQuizThemePreset("erg-classic");
  const theme = themePreset.theme;

  return (
    <section className="classic-editor__property-live-preview" aria-live="polite">
      <div className="classic-editor__property-preview-titlebar">
        <span>{t("quiz.propertiesTabResult")}</span>
        <strong>{value.result.feedbackMode === "according-to-result" ? t("quiz.propertiesFeedbackAccordingToResult") : t("quiz.propertiesFeedbackDespiteResult")}</strong>
      </div>

      <div
        className="classic-editor__property-result-student-preview"
        style={getQuizThemeStyle(theme)}
      >
        <section
          className="classic-editor__result-student-main"
          style={{ background: theme.playerBackground, borderColor: theme.canvasBorder }}
        >
          <div className="classic-editor__result-student-resource">
            <span>Tài nguyên</span>
            <i />
            <span>{t("common.results")}</span>
          </div>

          <div
            className="classic-editor__result-student-canvas"
            style={{ background: theme.playerBackground, borderColor: theme.canvasBorder }}
          >
            <div
              className="classic-editor__result-student-title"
              style={{ background: theme.headerBackground, color: theme.headerText }}
            >
              <span>{value.info.title}</span>
              <strong>{t("common.results")}</strong>
            </div>

            <div className="classic-editor__result-final-preview">
              <div className="classic-editor__result-final-art is-left" />
              <div className="classic-editor__result-final-art is-blue" />
              <div className="classic-editor__result-final-art is-pink" />
              <div className="classic-editor__result-final-art is-warm" />
              <div className="classic-editor__result-final-mark is-fail">
                <HighlightOffOutlinedIcon fontSize="inherit" />
              </div>
              <strong>{value.result.failMessage}</strong>
              {value.result.showStatistics ? (
                <div className="classic-editor__result-final-score">
                  <span>{t("player.score")}</span>
                  <b>306/1000</b>
                </div>
              ) : null}
              <button type="button" disabled>
                {value.result.reviewButtonLabel}
              </button>
              <em>{value.result.thankYouMessage}</em>
            </div>
          </div>

          <div className="classic-editor__result-student-footer">
            <span>{value.result.showStatistics ? `${t("quiz.propertiesPassingRate")}: ${value.settings.passingRate}%` : t("common.results")}</span>
            {value.result.showFinishButton ? (
              <button type="button" disabled style={{ background: theme.sidebarActiveBackground }}>
                {t("common.done")}
              </button>
            ) : null}
          </div>
        </section>

        <aside
          className="classic-editor__result-student-sidebar"
          style={{ background: theme.playerBackground, borderColor: theme.canvasBorder }}
        >
          <div className="classic-editor__result-student-sidebar-tabs">
            <button type="button" className="is-active" style={{ background: theme.sidebarActiveBackground }}>
              MỤC LỤC
            </button>
            <button type="button">GHI CHÚ</button>
          </div>
          <div className="classic-editor__result-student-search">
            <span>Tìm kiếm</span>
            <i>⌕</i>
          </div>
          <div className="classic-editor__result-student-outline">
            <div className="classic-editor__result-student-outline-item">
              <span className="is-thumb" />
              <strong>1. Trang giới thiệu</strong>
              <small>{value.info.page.courseTitle}</small>
            </div>
            {[1, 2, 3, 4].map((number) => (
              <div key={number} className="classic-editor__result-student-outline-item">
                <span className="is-number" style={{ color: theme.accentStart }}>{number}</span>
                <strong>{number}. Câu hỏi trong bài kiểm tra...</strong>
                <small>Đã trả lời</small>
              </div>
            ))}
            <div className="classic-editor__result-student-outline-item is-active">
              <span className="is-number">✓</span>
              <strong>{t("common.results")}</strong>
              <small>{value.result.feedbackMode === "according-to-result" ? t("quiz.propertiesFeedbackAccordingToResult") : t("quiz.propertiesFeedbackDespiteResult")}</small>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function PropertyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="classic-editor__property-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
