import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { overlineSx, wordChipSx } from "@/components/quiz/questions/drag-words-question";
import { pieceName } from "@/components/quiz/questions/matching-question/matching-helpers";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { DragDropItem } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** The item's image before its label, sized like the matching pieces. Next to text it is decorative; alone it names the item. */
function ItemFace({ item }: { item: DragDropItem }) {
  return (
    <>
      {item.image?.url ? (
        <Box
          alt={item.image.alt || (item.label ? "" : pieceName(item.label, item.image))}
          component="img"
          src={item.image.url}
          sx={{ borderRadius: `${tokens.radius.xs}px`, display: "block", maxHeight: 84, maxWidth: 150, objectFit: "cover", my: 0.5 }}
        />
      ) : null}
      {item.label}
    </>
  );
}

const cardSx = { bgcolor: "background.paper", border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, p: 1.5 } as const;

export function DragDropQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const targets = question.dropTargets ?? [];
  const items = question.dragDropItems ?? [];
  const placements = value.dragDropPlacements ?? {};
  const unplaced = items.filter((item) => !placements[item.id]).length;

  function placeItem(itemId: string, targetId: string) {
    if (submitted) return;

    onChange({
      dragDropPlacements: {
        ...placements,
        [itemId]: targetId,
      },
    });
  }

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region-wide" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
          {targets.map((target) => {
            const assignedItems = items.filter((item) => placements[item.id] === target.id);

            return (
              <Box key={target.id} role="group" aria-label={target.label} sx={{ ...cardSx, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
                  <Box component="span" sx={{ typography: "subtitle2" }}>{target.label}</Box>
                  <Box component="span" sx={{ typography: "caption", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{assignedItems.length}</Box>
                </Box>
                <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, minHeight: 40 }}>
                  {assignedItems.length ? (
                    assignedItems.map((item) => (
                      <Box component="span" key={item.id} sx={{ ...wordChipSx(), minHeight: 36, py: 0.25 }}>
                        <ItemFace item={item} />
                      </Box>
                    ))
                  ) : (
                    <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>Chưa có thẻ nào</Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box component="span" sx={overlineSx}>{`Thẻ cần xếp · ${unplaced} chưa xếp`}</Box>
          {items.map((item) => {
            const selectedTargetId = placements[item.id] ?? "";
            const correctTargetId = result?.correctDragDropPlacements?.[item.id] ?? item.correctTargetId;
            const isCorrect = reviewMode && selectedTargetId === correctTargetId;

            return (
              <Box
                key={item.id}
                sx={{
                  ...cardSx,
                  alignItems: "center",
                  borderColor: reviewMode ? (isCorrect ? "success.main" : "error.main") : tokens.color.border,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "space-between",
                }}
              >
                <Box component="span" sx={{ typography: "subtitle2", alignItems: "center", display: "inline-flex", gap: 1, minWidth: 0 }}><ItemFace item={item} /></Box>
                <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {targets.map((target) => {
                    const on = selectedTargetId === target.id;
                    // Review colours the chips like choice options: the right group green, a wrong pick red.
                    const tone = !reviewMode ? null : target.id === correctTargetId ? "success" : on ? "error" : null;
                    return (
                      <ButtonBase
                        key={target.id}
                        type="button"
                        disabled={submitted}
                        aria-pressed={on}
                        aria-label={tone === "success" ? `${target.label}, đáp án đúng` : tone === "error" ? `${target.label}, bạn chọn sai` : undefined}
                        sx={{
                          typography: "body2",
                          bgcolor: tone ? tokens.statusTint[tone].bg : on ? tokens.color.primarySofter : "background.paper",
                          border: "1px solid",
                          borderColor: tone ? `${tone}.main` : on ? "primary.main" : tokens.color.border,
                          borderRadius: `${tokens.radius.chip}px`,
                          color: tone ? tokens.statusTint[tone].color : on ? tokens.statusTint.info.color : "text.secondary",
                          fontWeight: on || tone ? "fontWeightBold" : "fontWeightMedium",
                          height: 36,
                          px: 1.75,
                          whiteSpace: "nowrap",
                          "&.Mui-focusVisible": { boxShadow: tokens.shadow.focus },
                          "&.Mui-disabled": { cursor: "default" },
                        }}
                        onClick={() => placeItem(item.id, target.id)}
                      >
                        {target.label}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </QuestionBodyWithImage>
  );
}
