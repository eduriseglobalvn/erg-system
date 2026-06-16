import { Check as CheckIcon } from "@/components/mui-icon-shim";
import { X as CloseIcon } from "@/components/mui-icon-shim";

import { cn } from "@/utils/cn";
import { useI18n } from "@/platform/i18n";

export function ResultTabs({
  activeTab,
  onChange,
}: {
  activeTab: "passed" | "failed";
  onChange: (tab: "passed" | "failed") => void;
}) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__result-tabs">
      <button
        type="button"
        onClick={() => onChange("passed")}
        className={cn("classic-editor__result-tab", activeTab === "passed" && "is-active")}
      >
        <span className="classic-editor__result-tab-icon is-pass"><CheckIcon className="h-4 w-4" size="1em" /></span>
        <span>{t("quiz.passed")}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("failed")}
        className={cn("classic-editor__result-tab", activeTab === "failed" && "is-active")}
      >
        <span className="classic-editor__result-tab-icon is-fail"><CloseIcon className="h-4 w-4" size="1em" /></span>
        <span>{t("quiz.failed")}</span>
      </button>
    </div>
  );
}
