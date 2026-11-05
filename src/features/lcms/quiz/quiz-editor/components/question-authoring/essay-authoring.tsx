import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useState } from "react";

import type { EssayRubricCriterion, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { newRowId, usePendingFocus } from "./sortable-rows";

/** A marking guide for the teacher: text criteria only. The server never sends it to learners. */
export function EssayAuthoring({ question, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const rubric = question.essayRubric ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const { rootRef, focusLater } = usePendingFocus();
  const update = (change: (latest: EssayRubricCriterion[]) => EssayRubricCriterion[]) =>
    onUpdate((latest) => ({ ...latest, essayRubric: change(latest.essayRubric ?? []) }));

  const append = () => {
    const id = newRowId("criterion");
    setFocusId(id);
    update((list) => [...list, { id, label: "", points: 0 }]);
  };

  const remove = (index: number) => {
    const neighbour = rubric[index + 1] ?? rubric[index - 1];
    focusLater(neighbour ? `[data-input-id="${neighbour.id}"]` : "[data-add-criterion]");
    update((list) => list.filter((c) => c.id !== rubric[index].id));
  };

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box aria-hidden sx={{ border: "1.5px solid", borderColor: tokens.color.border, borderRadius: `${tokens.radius.control}px`, minHeight: 64, px: 1.5, py: 1.25, typography: "body2", color: "text.secondary" }}>
        Học viên viết bài ở đây…
      </Box>
      <Box sx={{ typography: "body2", color: "text.secondary" }}>Gợi ý chấm cho giáo viên (học viên không thấy)</Box>
      {rubric.map((criterion, index) => {
        const n = index + 1;
        return (
          <Box key={criterion.id} sx={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 0.75, border: "1.5px solid", borderColor: tokens.color.borderStrong, typography: "body2", fontWeight: "fontWeightMedium", color: "text.secondary" }}>{n}</Box>
            <InputBase
              autoFocus={criterion.id === focusId}
              fullWidth
              inputProps={{ "aria-label": `Tiêu chí ${n}`, "data-input-id": criterion.id }}
              onChange={(e) => update((list) => list.map((c) => (c.id === criterion.id ? { ...c, label: e.target.value } : c)))}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
                e.preventDefault();
                if (!e.repeat && index === rubric.length - 1 && criterion.label.trim()) append();
              }}
              placeholder={`Tiêu chí ${n}`}
              sx={{ typography: "body1" }}
              value={criterion.label}
            />
            <IconButton aria-label={`Xoá tiêu chí ${n}`} onClick={() => remove(index)} size="small"><CloseIcon fontSize="small" /></IconButton>
          </Box>
        );
      })}
      <Box>
        <Button
          data-add-criterion
          onClick={append}
          startIcon={<AddIcon />}
          sx={{
            justifyContent: "flex-start", height: 44, width: "min(420px, 100%)", px: 2, color: "primary.main",
            border: "1.5px dashed", borderColor: tokens.color.border, borderRadius: `${tokens.radius.card}px`,
          }}
          variant="text"
        >
          Thêm tiêu chí
        </Button>
      </Box>
    </Box>
  );
}
