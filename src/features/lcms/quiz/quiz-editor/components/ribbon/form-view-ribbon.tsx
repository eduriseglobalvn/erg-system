import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PreviewIcon from "@mui/icons-material/Preview";
import PublishIcon from "@mui/icons-material/Publish";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import TableRowsIcon from "@mui/icons-material/TableRows";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

import { IntroductionMenu, QuestionMenu } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus";
import { RibbonGroup, ToolbarButton } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-primitives";
import { useI18n } from "@/platform/i18n";
import type { IntroSlideKind, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

type FormViewRibbonProps = {
  onAddQuestionGroup: () => void;
  onAddQuestion: (type: QuestionType) => void;
  onAddIntroduction: (type: IntroSlideKind) => void;
  onOpenQuizProperties: () => void;
  onOpenResults: () => void;
  onOpenPlayerTemplate: () => void;
  onOpenPreview: () => void;
  onOpenPublish: () => void;
};

export function FormViewRibbon({
  onAddQuestionGroup,
  onAddQuestion,
  onAddIntroduction,
  onOpenQuizProperties,
  onOpenResults,
  onOpenPlayerTemplate,
  onOpenPreview,
  onOpenPublish,
}: FormViewRibbonProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"Home" | "Help">("Home");
  const [openMenu, setOpenMenu] = useState<"question" | "introduction" | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const portalMenuRef = useRef<HTMLDivElement | null>(null);
  const questionTriggerRef = useRef<HTMLDivElement | null>(null);
  const introductionTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!ribbonRef.current?.contains(target) && !portalMenuRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    function updateMenuPosition() {
      const trigger = openMenu === "question" ? questionTriggerRef.current : introductionTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const estimatedWidth = openMenu === "question" ? 474 : 358;
      const viewportPadding = 8;

      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.min(
          Math.max(viewportPadding, rect.left - 2),
          window.innerWidth - estimatedWidth - viewportPadding,
        ),
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [openMenu]);

  return (
    <div ref={ribbonRef} className="classic-editor__form-ribbon">
      <div className="classic-editor__form-tabs">
        <button type="button" className="classic-editor__app-button">
          <span className="classic-editor__app-button-lines" />
        </button>
        {(["Home", "Help"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn("classic-editor__form-tab", activeTab === tab && "is-active")}
          >
            {t(tab === "Home" ? "quiz.formTabHome" : "quiz.formTabHelp")}
          </button>
        ))}
      </div>

      <div className="classic-editor__ribbon">
        {activeTab === "Home" ? (
          <div className="classic-editor__ribbon-scroll">
            <RibbonGroup label={t("common.new")}>
              <div ref={questionTriggerRef}>
                <ToolbarButton
                  label={t("common.question")}
                  iconNode={<QuizOutlinedIcon className="h-6 w-6" fontSize="inherit" />}
                  caret
                  size="regular"
                  active={openMenu === "question"}
                  onClick={() => setOpenMenu((current) => (current === "question" ? null : "question"))}
                />
              </div>
              <ToolbarButton
                label={t("common.questionGroup")}
                iconNode={<TableRowsIcon className="h-6 w-6" fontSize="inherit" />}
                size="regular"
                onClick={onAddQuestionGroup}
              />
              <div ref={introductionTriggerRef}>
                <ToolbarButton
                  label={t("common.introduction")}
                  iconNode={<SlideshowOutlinedIcon className="h-6 w-6" fontSize="inherit" />}
                  caret
                  size="regular"
                  active={openMenu === "introduction"}
                  onClick={() => setOpenMenu((current) => (current === "introduction" ? null : "introduction"))}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup label={t("common.settings")}>
              <ToolbarButton
                label={t("quiz.quizProperties")}
                iconNode={<SettingsOutlinedIcon className="h-6 w-6" fontSize="inherit" />}
                size="wide"
                onClick={onOpenQuizProperties}
              />
              <ToolbarButton
                label={t("quiz.playerTemplate")}
                iconNode={<PaletteOutlinedIcon className="h-6 w-6" fontSize="inherit" />}
                size="wide"
                onClick={onOpenPlayerTemplate}
              />
            </RibbonGroup>

            <RibbonGroup label={t("common.publish")}>
              <ToolbarButton
                label={t("common.preview")}
                iconNode={<PreviewIcon className="h-6 w-6" fontSize="inherit" />}
                size="regular"
                onClick={onOpenPreview}
              />
              <ToolbarButton
                label={t("common.publish")}
                iconNode={<PublishIcon className="h-6 w-6" fontSize="inherit" />}
                size="regular"
                onClick={onOpenPublish}
              />
            </RibbonGroup>

            <RibbonGroup label={t("common.results")}>
              <ToolbarButton
                label={t("quiz.manageResults")}
                iconNode={<InsightsOutlinedIcon className="h-6 w-6" fontSize="inherit" />}
                size="wide"
                onClick={onOpenResults}
              />
            </RibbonGroup>
          </div>
        ) : (
          <div className="classic-editor__ribbon-scroll classic-editor__ribbon-scroll--help">
            <div className="classic-editor__ribbon-help">
              <div className="classic-editor__ribbon-help-card">
                <div className="classic-editor__ribbon-help-title">{t("quiz.helpQuickStartTitle")}</div>
                <p>{t("quiz.helpQuickStartCopy")}</p>
              </div>
              <div className="classic-editor__ribbon-help-card">
                <div className="classic-editor__ribbon-help-title">{t("quiz.helpOrganizeTitle")}</div>
                <p>{t("quiz.helpOrganizeCopy")}</p>
              </div>
              <div className="classic-editor__ribbon-help-card">
                <div className="classic-editor__ribbon-help-title">{t("quiz.helpPublishTitle")}</div>
                <p>{t("quiz.helpPublishCopy")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {openMenu && menuPosition
        ? createPortal(
            <div
              ref={portalMenuRef}
              className="fixed z-[200]"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {openMenu === "question" ? (
                <QuestionMenu
                  onSelect={(type) => {
                    onAddQuestion(type);
                    setOpenMenu(null);
                  }}
                />
              ) : (
                <IntroductionMenu
                  onSelect={(type) => {
                    onAddIntroduction(type);
                    setOpenMenu(null);
                  }}
                />
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
