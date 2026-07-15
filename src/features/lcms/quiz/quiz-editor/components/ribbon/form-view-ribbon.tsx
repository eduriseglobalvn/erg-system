import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  ButtonBase,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { BookOpen as BookOpenIcon } from "@/components/mui-icon-shim";
import { Palette as PaletteOutlinedIcon } from "@/components/mui-icon-shim";
import { ChevronDown as ArrowDropDownIcon } from "@/components/mui-icon-shim";
import { Layers as LevelIcon } from "@/components/mui-icon-shim";
import { ListTree as TopicIcon } from "@/components/mui-icon-shim";
import { Search as SearchIcon } from "@/components/mui-icon-shim";
import { Upload as PublishIcon } from "@/components/mui-icon-shim";
import { HelpCircle as QuizOutlinedIcon } from "@/components/mui-icon-shim";
import { Presentation as SlideshowOutlinedIcon } from "@/components/mui-icon-shim";

import { IntroductionMenu, QuestionMenu } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus";
import { useI18n } from "@/platform/i18n";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type CourseScopeOption = {
  id: string;
  label: string;
  meta: string;
};

export type LevelScopeOption = {
  id: string;
  courseId: string;
  label: string;
  meta: string;
};

export type TopicOption = {
  id: string;
  label: string;
  description: string;
  count: number;
};

type FormViewRibbonProps = {
  searchValue: string;
  courseOptions: CourseScopeOption[];
  selectedCourseId: string;
  levelOptions: LevelScopeOption[];
  selectedLevelId: string | null;
  topicOptions: TopicOption[];
  selectedTopicId: string;
  onChangeCourse: (value: string) => void;
  onChangeLevel: (value: string) => void;
  onChangeTopic: (value: string) => void;
  onChangeSearch: (value: string) => void;
  onAddQuestion: (type: QuestionType, preset?: QuestionCreationPreset) => void;
  onAddIntroduction: (type: IntroSlideKind) => void;
  onOpenPlayerTemplate: () => void;
  onOpenPublish: () => void;
};

export function FormViewRibbon({
  searchValue,
  courseOptions,
  selectedCourseId,
  levelOptions,
  selectedLevelId,
  topicOptions,
  selectedTopicId,
  onChangeCourse,
  onChangeLevel,
  onChangeTopic,
  onChangeSearch,
  onAddQuestion,
  onAddIntroduction,
  onOpenPlayerTemplate,
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
      const estimatedWidth = openMenu === "question" ? 624 : 372;
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
          flexWrap: "nowrap",
          gap: 0.75,
          minHeight: 52,
          overflowX: "auto",
          borderBottom: "1px solid var(--classic-fluent-border, #d7e0ec)",
          bgcolor: "rgba(248, 251, 255, 0.9)",
          px: 1.25,
          py: 0.375,
          boxShadow: "inset 0 -1px 0 rgba(255, 255, 255, 0.72)",
          backdropFilter: "saturate(145%) blur(14px)",
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

        <RibbonUtilitySection
          onOpenPlayerTemplate={onOpenPlayerTemplate}
          onOpenPublish={onOpenPublish}
          playerLabel={t("quiz.playerTemplate")}
          publishLabel={t("common.publish")}
        />

        <RibbonScopeSection
          courseOptions={courseOptions}
          selectedCourseId={selectedCourseId}
          levelOptions={levelOptions}
          selectedLevelId={selectedLevelId}
          topicOptions={topicOptions}
          selectedTopicId={selectedTopicId}
          onChangeCourse={onChangeCourse}
          onChangeLevel={onChangeLevel}
          onChangeTopic={onChangeTopic}
        />

        <RibbonSearchSection
          searchValue={searchValue}
          searchLabel={`${t("common.search")} ${t("common.question").toLowerCase()}`}
          onChangeSearch={onChangeSearch}
        />
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

function RibbonUtilitySection({
  playerLabel,
  publishLabel,
  onOpenPlayerTemplate,
  onOpenPublish,
}: {
  playerLabel: string;
  publishLabel: string;
  onOpenPlayerTemplate: () => void;
  onOpenPublish: () => void;
}) {
  return (
    <Box component="section" className="classic-editor__ribbon-utilities" aria-label={`${playerLabel} / ${publishLabel}`}>
      <button
        type="button"
        className="classic-editor__ribbon-icon-action"
        aria-label={playerLabel}
        title={playerLabel}
        onClick={onOpenPlayerTemplate}
      >
        <PaletteOutlinedIcon size="1em" />
      </button>
      <button
        type="button"
        className="classic-editor__ribbon-publish-action"
        onClick={onOpenPublish}
      >
        <PublishIcon size="1em" />
        <span>{publishLabel}</span>
      </button>
    </Box>
  );
}

function RibbonSearchSection({
  searchValue,
  searchLabel,
  onChangeSearch,
}: {
  searchValue: string;
  searchLabel: string;
  onChangeSearch: (value: string) => void;
}) {
  return (
    <Box component="section" className="classic-editor__ribbon-search-actions" aria-label={searchLabel}>
      <label className="classic-editor__ribbon-searchbar">
        <SearchIcon size="1em" />
        <input
          type="search"
          value={searchValue}
          aria-label={searchLabel}
          placeholder={searchLabel}
          onChange={(event) => onChangeSearch(event.target.value)}
        />
      </label>
    </Box>
  );
}

function RibbonScopeSection({
  courseOptions,
  selectedCourseId,
  levelOptions,
  selectedLevelId,
  topicOptions,
  selectedTopicId,
  onChangeCourse,
  onChangeLevel,
  onChangeTopic,
}: {
  courseOptions: CourseScopeOption[];
  selectedCourseId: string;
  levelOptions: LevelScopeOption[];
  selectedLevelId: string | null;
  topicOptions: TopicOption[];
  selectedTopicId: string;
  onChangeCourse: (value: string) => void;
  onChangeLevel: (value: string) => void;
  onChangeTopic: (value: string) => void;
}) {
  const selectedCourse = courseOptions.find((option) => option.id === selectedCourseId);
  const selectedLevel = levelOptions.find((option) => option.id === selectedLevelId);
  const selectedTopic = topicOptions.find((option) => option.id === selectedTopicId);
  const hasLevelOptions = levelOptions.length > 0;

  return (
    <Box
      component="section"
      className={`classic-editor__ribbon-scope ${hasLevelOptions ? "has-level" : "has-topic-only"}`}
      aria-label={hasLevelOptions ? "Môn, level và chủ đề câu hỏi" : "Môn và chủ đề câu hỏi"}
    >
      <RibbonScopeField icon={<BookOpenIcon size="1em" />} label="Môn">
        <Select
          size="small"
          value={selectedCourseId}
          onChange={(event) => onChangeCourse(String(event.target.value))}
          displayEmpty
          className="classic-editor__ribbon-scope-select"
          inputProps={{ "aria-label": "Môn học", title: selectedCourse?.meta ?? "" }}
          MenuProps={{
            slotProps: { paper: { className: "classic-editor__ribbon-scope-menu" } },
          }}
          renderValue={(value) =>
            courseOptions.find((option) => option.id === value)?.label ?? selectedCourse?.label ?? ""
          }
        >
          {courseOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Box className="classic-editor__ribbon-option-copy">
                <span>{option.label}</span>
                <small>{option.meta}</small>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </RibbonScopeField>

      {hasLevelOptions ? (
        <RibbonScopeField icon={<LevelIcon size="1em" />} label="Level">
          <Select
            size="small"
            value={selectedLevelId ?? ""}
            onChange={(event) => onChangeLevel(String(event.target.value))}
            displayEmpty
            className="classic-editor__ribbon-scope-select"
            inputProps={{ "aria-label": "Level", title: selectedLevel?.meta ?? "" }}
            MenuProps={{
              slotProps: { paper: { className: "classic-editor__ribbon-scope-menu" } },
            }}
            renderValue={(value) =>
              formatLevelRibbonValue(levelOptions.find((option) => option.id === value)?.label ?? selectedLevel?.label ?? "")
            }
          >
            {levelOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Box className="classic-editor__ribbon-option-copy">
                  <span>{option.label}</span>
                  <small>{option.meta}</small>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </RibbonScopeField>
      ) : null}

      <RibbonScopeField icon={<TopicIcon size="1em" />} label="Chủ đề">
        <Select
          size="small"
          value={selectedTopicId}
          onChange={(event) => onChangeTopic(String(event.target.value))}
          displayEmpty
          className="classic-editor__ribbon-scope-select"
          inputProps={{ "aria-label": "Chủ đề", title: selectedTopic?.description ?? "" }}
          MenuProps={{
            slotProps: { paper: { className: "classic-editor__ribbon-scope-menu" } },
          }}
          renderValue={(value) => {
            const topic = topicOptions.find((option) => option.id === value) ?? selectedTopic;
            return topic ? `${topic.label} (${topic.count})` : "";
          }}
        >
          {topicOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Box className="classic-editor__ribbon-topic-option">
                <Box className="classic-editor__ribbon-option-copy">
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </Box>
                <b>{option.count}</b>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </RibbonScopeField>
    </Box>
  );
}

function RibbonScopeField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <Box className="classic-editor__ribbon-scope-field">
      <Typography component="label" className="classic-editor__ribbon-scope-label">
        {icon}
        <span>{label}</span>
      </Typography>
      {children}
    </Box>
  );
}

function formatLevelRibbonValue(label: string) {
  if (label === "Nền tảng") return "Nền";
  return label.replace(/^(Cấp|Level)\s+/i, "");
}

function RibbonSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      component="section"
      aria-label={label}
      className="classic-editor__ribbon-section"
      sx={{
        display: "flex",
        minWidth: "max-content",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{children}</Box>
    </Box>
  );
}

function RibbonAction({
  label,
  icon,
  active = false,
  caret = false,
  primary = false,
  tone = "default",
  wide = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  caret?: boolean;
  primary?: boolean;
  tone?: "default" | "primary";
  wide?: boolean;
  onClick?: () => void;
}) {
  const isPrimaryTone = tone === "primary";

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
        height: 38,
        minWidth: primary ? 116 : wide ? 140 : 104,
        justifyContent: "center",
        border: "1px solid",
        borderColor: isPrimaryTone
          ? "rgba(15, 108, 189, 0.78)"
          : active
            ? "rgba(15, 108, 189, 0.36)"
            : "rgba(148, 163, 184, 0.2)",
        borderRadius: "10px",
        bgcolor: isPrimaryTone
          ? "var(--erg-blue, #0f6cbd)"
          : active
            ? "rgba(15, 108, 189, 0.09)"
            : "rgba(255, 255, 255, 0.78)",
        color: isPrimaryTone ? "#ffffff" : active ? "var(--erg-blue, #0f6cbd)" : "#263445",
        px: 1.25,
        fontSize: 12.5,
        fontWeight: 750,
        lineHeight: 1,
        boxShadow: isPrimaryTone
          ? "0 8px 18px rgba(15, 108, 189, 0.16)"
          : active
            ? "inset 0 0 0 1px rgba(15, 108, 189, 0.08)"
            : "none",
        transition: "background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease",
        "&:hover": {
          borderColor: isPrimaryTone ? "rgba(11, 92, 161, 0.95)" : "rgba(15, 108, 189, 0.34)",
          bgcolor: isPrimaryTone ? "#0b5ca1" : "rgba(15, 108, 189, 0.06)",
          color: isPrimaryTone ? "#ffffff" : "var(--erg-blue, #0f6cbd)",
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
