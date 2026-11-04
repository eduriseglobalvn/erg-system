import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import InsightsOutlinedIcon from "@mui/icons-material/Insights";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import QuizOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/Tune";

import { QuestionDefaultsSection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties/question-defaults-section";
import { QuizInformationSection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties/quiz-information-section";
import { QuizOthersSection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties/quiz-others-section";
import { QuizResultSection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties/quiz-result-section";
import { QuizSettingsSection } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties/quiz-settings-section";
import { useI18n } from "@/platform/i18n";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

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
            <SettingsOutlinedIcon className="h-4 w-4 text-[#41688f]" sx={{ fontSize: "1em" }} />
            <span>{t("quiz.quizProperties")}</span>
          </div>
          <button type="button" className="classic-editor__dialog-close" onClick={onClose}>
            <CloseIcon className="h-4 w-4" sx={{ fontSize: "1em" }} />
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
                  <Icon className="h-4 w-4" sx={{ fontSize: "1em" }} />
                  <span>{t(getTabLabelKey(tabId))}</span>
                </button>
              );
            })}
          </aside>

          <div className="classic-editor__property-panel">
            {activeTab === "quiz-information" ? (
              <QuizInformationSection draft={draft} setDraft={setDraft} selectedThemeId={selectedThemeId} />
            ) : null}

            {activeTab === "quiz-settings" ? <QuizSettingsSection draft={draft} setDraft={setDraft} /> : null}

            {activeTab === "quiz-result" ? <QuizResultSection draft={draft} setDraft={setDraft} /> : null}

            {activeTab === "question-settings" ? (
              <QuestionDefaultsSection draft={draft} setDraft={setDraft} />
            ) : null}

            {activeTab === "others" ? <QuizOthersSection draft={draft} setDraft={setDraft} /> : null}
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
