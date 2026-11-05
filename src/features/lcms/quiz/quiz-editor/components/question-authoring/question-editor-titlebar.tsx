import { useState, type ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { readinessLabel, type QuestionReadiness } from "./question-readiness";
import { QuestionViewToggle, type QuestionView } from "./question-view-toggle";

type Props = {
  number: number;
  total: number;
  typeLabel: string;
  readiness: QuestionReadiness;
  syncChip: ReactNode;
  view: QuestionView;
  onViewChange: (view: QuestionView) => void;
  onBack: () => void;
  onChangeType: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function QuestionEditorTitlebar({ number, total, typeLabel, readiness, syncChip, view, onViewChange, onBack, onChangeType, onDuplicate, onDelete }: Props) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const run = (action: () => void) => () => {
    setMenuAnchor(null);
    action();
  };

  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, px: 2, py: 1 }}>
      <Button aria-label="Quay lại danh sách" onClick={onBack} startIcon={<ChevronLeftIcon />} sx={{ color: "text.secondary" }} variant="text">
        Danh sách câu hỏi
      </Button>
      <Divider flexItem orientation="vertical" sx={{ my: 0.5 }} />
      <Typography component="h2" variant="subtitle2">{`Câu ${number} / ${total}`}</Typography>
      <ErgStatusChip dot={false} label={typeLabel} sx={{ border: 1, borderColor: tokens.color.border }} tone="neutral" />
      {readiness.ready ? (
        <ErgStatusChip label={readinessLabel(readiness)} tone="success" />
      ) : (
        <ErgStatusChip icon={<WarningAmberIcon sx={{ color: "inherit !important", fontSize: tokens.size.iconSm }} />} label={readinessLabel(readiness)} tone="warning" />
      )}
      {syncChip}
      <Box sx={{ flex: 1 }} />
      <QuestionViewToggle onChange={onViewChange} value={view} />
      <IconButton aria-label="Thêm thao tác" aria-haspopup="menu" onClick={(event) => setMenuAnchor(event.currentTarget)} size="small">
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        onClose={() => setMenuAnchor(null)}
        open={Boolean(menuAnchor)}
        slotProps={{ list: { "aria-label": "Thao tác câu hỏi" }, paper: { sx: { minWidth: 240 } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem onClick={run(onChangeType)}>Đổi dạng câu hỏi…</MenuItem>
        <MenuItem onClick={run(onDuplicate)}>Nhân bản</MenuItem>
        <Divider />
        <MenuItem onClick={run(onDelete)} sx={{ color: "error.main" }}>Xoá câu hỏi</MenuItem>
      </Menu>
    </Box>
  );
}
