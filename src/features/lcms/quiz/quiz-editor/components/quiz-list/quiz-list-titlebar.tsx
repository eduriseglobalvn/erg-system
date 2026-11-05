import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { useState, type ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuizThemeDialog } from "@/features/lcms/quiz/quiz-theme/quiz-theme-dialog";
import type { NotReadyQuestion, PublishFailure } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-save-publish";
import { PublishBlockedPopover } from "./publish-blocked-popover";

type Option = { id: string; label: string };

/** Môn, Level, the save chip and the screen's one contained button, with the server's refusal right under it. */
export function QuizListTitlebar({
  courseOptions, selectedCourseId, levelOptions, selectedLevelId, onChangeCourse, onChangeLevel,
  syncChip, playerTemplate, onApplyTheme, themeDisabled, onPublish, publishBlockedReason, publishReadinessOnly, notReady, onOpenQuestion,
  publishFailure, onDismissPublishFailure, isPublishing,
}: {
  courseOptions: Option[];
  selectedCourseId: string;
  levelOptions: Option[];
  selectedLevelId: string | null;
  onChangeCourse: (courseId: string) => void;
  onChangeLevel: (levelId: string) => void;
  syncChip: ReactNode;
  playerTemplate: QuizPlayerTemplate;
  onApplyTheme: (next: QuizPlayerTemplate) => void;
  /** The template is replaced when the draft loads, so a theme applied before that would be lost. */
  themeDisabled: boolean;
  onPublish: () => void;
  publishBlockedReason: string | null;
  publishReadinessOnly: boolean;
  notReady: NotReadyQuestion[];
  onOpenQuestion: (slideId: string) => void;
  publishFailure: PublishFailure | null;
  onDismissPublishFailure: () => void;
  isPublishing: boolean;
}) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const select = (label: string, value: string, options: Option[], onChange: (value: string) => void) => (
    <ErgSelect
      label={label}
      onChange={(event) => onChange(event.target.value)}
      options={options.map((option) => ({ label: option.label, value: option.id }))}
      size="small"
      sx={{ maxWidth: 220 }}
      value={options.some((option) => option.id === value) ? value : ""}
    />
  );
  // Not-ready stays clickable (it opens the list); every other reason is a dead button with its reason as tooltip.
  const hardBlocked = Boolean(publishBlockedReason) && !publishReadinessOnly;

  return (
    <>
      <Box sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, px: 2, py: 1.5 }}>
        {select("Môn", selectedCourseId, courseOptions, onChangeCourse)}
        {select("Level", selectedLevelId ?? "", levelOptions, onChangeLevel)}
        {syncChip}
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <Button disabled={themeDisabled} onClick={() => setThemeOpen(true)} variant="text">Giao diện bài</Button>
          <Tooltip title={publishBlockedReason ?? ""}>
            <span>
              <ErgButton
                aria-disabled={publishReadinessOnly || undefined}
                aria-expanded={publishReadinessOnly ? Boolean(popoverAnchor) : undefined}
                aria-haspopup={publishReadinessOnly ? "dialog" : undefined}
                disabled={hardBlocked}
                loading={isPublishing}
                onClick={(event) => (publishReadinessOnly ? setPopoverAnchor(event.currentTarget) : onPublish())}
                sx={publishReadinessOnly ? { "&, &:hover": { bgcolor: "action.disabledBackground", color: "action.disabled" } } : undefined}
                variant="contained"
              >
                Xuất bản
              </ErgButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      {publishFailure ? (
        <Alert closeText="Đóng" onClose={onDismissPublishFailure} severity="error" sx={{ borderRadius: 0 }}>
          <Box>Máy chủ chưa cho xuất bản.</Box>
          <Box>{publishFailure.message}</Box>
          {publishFailure.items.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {publishFailure.items.map((item, index) => <li key={`${index}:${item}`}>{item}</li>)}
            </Box>
          ) : null}
        </Alert>
      ) : null}
      <QuizThemeDialog
        onApply={(next) => {
          onApplyTheme(next);
          setThemeOpen(false);
        }}
        onClose={() => setThemeOpen(false)}
        open={themeOpen}
        value={playerTemplate}
      />
      <PublishBlockedPopover
        anchorEl={popoverAnchor}
        notReady={notReady}
        onClose={() => setPopoverAnchor(null)}
        onSelect={(slideId) => {
          setPopoverAnchor(null);
          onOpenQuestion(slideId);
        }}
      />
    </>
  );
}
