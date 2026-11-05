import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { useId } from "react";

import type { NotReadyQuestion } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-save-publish";

/** Why "Xuất bản" is not available yet: every unfinished question, one tap from its editor. */
export function PublishBlockedPopover({ anchorEl, notReady, onClose, onSelect }: {
  anchorEl: HTMLElement | null;
  notReady: NotReadyQuestion[];
  onClose: () => void;
  onSelect: (slideId: string) => void;
}) {
  const titleId = useId();
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(anchorEl)}
      slotProps={{ paper: { "aria-labelledby": titleId, role: "dialog" } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Typography id={titleId} sx={{ px: 2, pt: 1.5 }} variant="subtitle2">{`Còn ${notReady.length} câu chưa sẵn sàng`}</Typography>
      <List dense sx={{ maxHeight: 320, maxWidth: 420, overflowY: "auto" }}>
        {notReady.map((item) => (
          <ListItemButton key={item.slideId} onClick={() => onSelect(item.slideId)}>
            <ListItemText primary={`Câu ${item.number}: ${item.title || "(chưa có đề bài)"} — ${item.label}`} />
          </ListItemButton>
        ))}
      </List>
    </Popover>
  );
}
