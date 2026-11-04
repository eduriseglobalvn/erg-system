import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/utils/cn";
import {
  informationThemeOptions,
  PropertyField,
  PropertySection,
  QuizInformationPreview,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import { getQuizThemePreset, getQuizThemeStyle } from "@/features/lcms/quiz/quiz-theme";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";

export type QuizInformationSectionProps = {
  draft: QuizProjectSettings;
  setDraft: Dispatch<SetStateAction<QuizProjectSettings>>;
  selectedThemeId: string;
};

export function QuizInformationSection({ draft, setDraft, selectedThemeId }: QuizInformationSectionProps) {
  const { t } = useI18n();

  return (
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
  );
}
