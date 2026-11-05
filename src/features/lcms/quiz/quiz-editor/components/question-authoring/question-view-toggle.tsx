import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export type QuestionView = "author" | "learner";

export function QuestionViewToggle({ value, onChange }: { value: QuestionView; onChange: (next: QuestionView) => void }) {
  return (
    <ToggleButtonGroup
      aria-label="Chế độ xem"
      exclusive
      onChange={(_, next: QuestionView | null) => next && onChange(next)}
      size="small"
      value={value}
    >
      <ToggleButton value="author">
        <EditOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
        Giáo viên soạn
      </ToggleButton>
      <ToggleButton value="learner">
        <PlayCircleOutlineIcon fontSize="small" sx={{ mr: 0.75 }} />
        Học viên làm
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
