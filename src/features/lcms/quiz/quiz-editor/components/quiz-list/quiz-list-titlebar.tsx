import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect } from "@/components/erg-mui/erg-form";

type Option = { id: string; label: string };

/** Môn, Level, the save chip and the screen's one contained button. */
export function QuizListTitlebar({
  courseOptions, selectedCourseId, levelOptions, selectedLevelId, onChangeCourse, onChangeLevel,
  syncChip, onOpenTheme, onPublish, publishBlockedReason, isPublishing,
}: {
  courseOptions: Option[];
  selectedCourseId: string;
  levelOptions: Option[];
  selectedLevelId: string | null;
  onChangeCourse: (courseId: string) => void;
  onChangeLevel: (levelId: string) => void;
  syncChip: ReactNode;
  onOpenTheme: () => void;
  onPublish: () => void;
  publishBlockedReason: string | null;
  isPublishing: boolean;
}) {
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

  return (
    <Box sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, px: 2, py: 1.5 }}>
      {select("Môn", selectedCourseId, courseOptions, onChangeCourse)}
      {select("Level", selectedLevelId ?? "", levelOptions, onChangeLevel)}
      {syncChip}
      <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
        <Button onClick={onOpenTheme} variant="text">Giao diện bài</Button>
        <Tooltip title={publishBlockedReason ?? ""}>
          <span>
            <ErgButton disabled={Boolean(publishBlockedReason)} loading={isPublishing} onClick={onPublish} variant="contained">
              Xuất bản
            </ErgButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
