import type { Dispatch, SetStateAction } from "react";
import { PropertyField, PropertySection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog-parts";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";

export type QuizOthersSectionProps = {
  draft: QuizProjectSettings;
  setDraft: Dispatch<SetStateAction<QuizProjectSettings>>;
};

export function QuizOthersSection({ draft, setDraft }: QuizOthersSectionProps) {
  const { t } = useI18n();

  return (
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
  );
}
