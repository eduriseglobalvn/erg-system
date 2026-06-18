import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Box, ButtonBase, Divider, Paper, Typography } from "@mui/material";
import { Palette as PaletteOutlinedIcon } from "@/components/mui-icon-shim";
import { ChevronDown as ArrowDropDownIcon } from "@/components/mui-icon-shim";
import { Eye as PreviewIcon } from "@/components/mui-icon-shim";
import { Upload as PublishIcon } from "@/components/mui-icon-shim";
import { HelpCircle as QuizOutlinedIcon } from "@/components/mui-icon-shim";
import { Settings as SettingsOutlinedIcon } from "@/components/mui-icon-shim";
import { Presentation as SlideshowOutlinedIcon } from "@/components/mui-icon-shim";
import { Table as TableRowsIcon } from "@/components/mui-icon-shim";
import { LineChart as InsightsOutlinedIcon } from "@/components/mui-icon-shim";

import { IntroductionMenu, QuestionMenu } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus";
import { useI18n } from "@/platform/i18n";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type FormViewRibbonProps = {
  onAddQuestionGroup: () => void;
  onAddQuestion: (type: QuestionType, preset?: QuestionCreationPreset) => void;
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
      const estimatedWidth = openMenu === "question" ? 224 : 358;
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
    <Box ref={ribbonRef} className="classic-editor__form-ribbon classic-editor__mui-form-ribbon">
      <Paper
        square
        elevation={0}
        className="classic-editor__mui-ribbon-surface"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 64,
          overflowX: "auto",
          borderBottom: "1px solid var(--classic-fluent-border, #d7e0ec)",
          bgcolor: "rgba(255, 255, 255, 0.88)",
          px: 1.5,
          py: 0.75,
          backdropFilter: "saturate(160%) blur(14px)",
        }}
      >
        <RibbonSection label={t("common.new")}>
          <Box ref={questionTriggerRef}>
            <RibbonAction
              label={t("common.question")}
              icon={<QuizOutlinedIcon size="1em" />}
              active={openMenu === "question"}
              caret
              primary
              onClick={() => setOpenMenu((current) => (current === "question" ? null : "question"))}
            />
          </Box>
          <RibbonAction
            label={t("common.questionGroup")}
            icon={<TableRowsIcon size="1em" />}
            wide
            onClick={onAddQuestionGroup}
          />
          <Box ref={introductionTriggerRef}>
            <RibbonAction
              label={t("common.introduction")}
              icon={<SlideshowOutlinedIcon size="1em" />}
              active={openMenu === "introduction"}
              caret
              wide
              onClick={() => setOpenMenu((current) => (current === "introduction" ? null : "introduction"))}
            />
          </Box>
        </RibbonSection>

        <Divider flexItem orientation="vertical" sx={{ borderColor: "rgba(145, 158, 171, 0.22)" }} />

        <RibbonSection label={t("common.settings")}>
          <RibbonAction
            label={t("quiz.quizProperties")}
            icon={<SettingsOutlinedIcon size="1em" />}
            wide
            onClick={onOpenQuizProperties}
          />
          <RibbonAction
            label={t("quiz.playerTemplate")}
            icon={<PaletteOutlinedIcon size="1em" />}
            wide
            onClick={onOpenPlayerTemplate}
          />
        </RibbonSection>

        <Divider flexItem orientation="vertical" sx={{ borderColor: "rgba(145, 158, 171, 0.22)" }} />

        <RibbonSection label={t("common.publish")}>
          <RibbonAction label={t("common.preview")} icon={<PreviewIcon size="1em" />} onClick={onOpenPreview} />
          <RibbonAction label={t("common.publish")} icon={<PublishIcon size="1em" />} onClick={onOpenPublish} />
        </RibbonSection>

        <Divider flexItem orientation="vertical" sx={{ borderColor: "rgba(145, 158, 171, 0.22)" }} />

        <RibbonSection label={t("common.results")}>
          <RibbonAction
            label={t("quiz.manageResults")}
            icon={<InsightsOutlinedIcon size="1em" />}
            wide
            onClick={onOpenResults}
          />
        </RibbonSection>
      </Paper>

      {openMenu && menuPosition
        ? createPortal(
            <div
              ref={portalMenuRef}
              className="fixed z-[200]"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {openMenu === "question" ? (
                <QuestionMenu
                  onSelect={(type, preset) => {
                    onAddQuestion(type, preset);
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
    </Box>
  );
}

function RibbonSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: "flex", minWidth: "max-content", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{children}</Box>
      <Typography
        component="div"
        sx={{
          color: "text.secondary",
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function RibbonAction({
  label,
  icon,
  active = false,
  caret = false,
  primary = false,
  wide = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  caret?: boolean;
  primary?: boolean;
  wide?: boolean;
  onClick?: () => void;
}) {
  return (
    <ButtonBase
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        height: 36,
        minWidth: primary ? 118 : wide ? 152 : 104,
        justifyContent: "center",
        border: "1px solid",
        borderColor: active ? "rgba(15, 108, 189, 0.36)" : "rgba(145, 158, 171, 0.22)",
        borderRadius: "10px",
        bgcolor: active ? "rgba(15, 108, 189, 0.09)" : "rgba(255, 255, 255, 0.76)",
        color: active ? "var(--erg-blue, #0f6cbd)" : "#263445",
        px: 1.25,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: active ? "inset 0 0 0 1px rgba(15, 108, 189, 0.08)" : "none",
        transition: "background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease",
        "&:hover": {
          borderColor: "rgba(15, 108, 189, 0.34)",
          bgcolor: "rgba(15, 108, 189, 0.06)",
          color: "var(--erg-blue, #0f6cbd)",
        },
        "&:active": {
          transform: "translateY(1px)",
        },
        "& svg": {
          width: 17,
          height: 17,
          flex: "0 0 auto",
        },
      }}
    >
      {icon}
      <Typography
        component="span"
        sx={{
          maxWidth: wide ? 128 : 84,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "inherit",
          fontWeight: "inherit",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      {caret ? <ArrowDropDownIcon size="1em" /> : null}
    </ButtonBase>
  );
}
