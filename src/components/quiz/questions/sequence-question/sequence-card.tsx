import { useDraggable, useDroppable } from "@dnd-kit/core";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useId, type KeyboardEvent, type ReactNode } from "react";

import type { SequenceItem } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

import { SequenceInlineImage } from "./sequence-media";
import { SEQUENCE_ROW } from "./sequence-order";

/** Review state of a row: undefined while answering or when the correct order is unknown. */
export type SequenceReview = { correctAt: number; right: boolean } | undefined;

const reviewColor = (review: SequenceReview) => (review ? (review.right ? "success.main" : "error.main") : undefined);

/** A drop row: the position number, then the card. A card dropped here is inserted at this row. */
export function SequenceRow({ itemId, position, review, children }: { itemId: string; position: number; review: SequenceReview; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `${SEQUENCE_ROW}${itemId}` });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "grid",
        gridTemplateColumns: "30px 1fr",
        gap: 1,
        alignItems: "center",
        borderRadius: `${tokens.radius.card}px`,
        ...(isOver ? { bgcolor: tokens.color.primarySofter, outline: `2px dashed ${tokens.color.primarySoft}`, outlineOffset: 2 } : null),
      }}
    >
      <Box sx={{ textAlign: "right", typography: "h6", fontWeight: "fontWeightBold", color: reviewColor(review) ?? "primary.main" }}>{position}</Box>
      {children}
    </Box>
  );
}

type CardProps = {
  item: SequenceItem;
  position: number;
  review: SequenceReview;
  compact: boolean;
  locked: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export function DraggableSequenceCard({ item, locked, ...rest }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, disabled: locked, attributes: { roleDescription: "thẻ kéo được" } });
  return <SequenceCard {...rest} item={item} locked={locked} dragging={isDragging} cardRef={setNodeRef} dragProps={{ ...attributes, ...listeners }} />;
}

export function SequenceCard({
  item,
  position,
  review,
  compact,
  locked = false,
  dragging = false,
  overlay = false,
  cardRef,
  dragProps,
  onKeyDown,
}: Partial<CardProps> & {
  item: SequenceItem;
  compact: boolean;
  dragging?: boolean;
  overlay?: boolean;
  cardRef?: (node: HTMLElement | null) => void;
  dragProps?: object;
}) {
  const captionId = useId();
  const wrong = review && !review.right;
  return (
    <ButtonBase
      ref={cardRef}
      disableRipple
      {...dragProps}
      data-sequence-id={overlay ? undefined : item.id}
      aria-label={overlay ? undefined : `${item.label}, vị trí ${position}`}
      {...(wrong ? { "aria-describedby": captionId } : null)}
      {...(overlay ? { "aria-hidden": true, tabIndex: -1 } : null)}
      onKeyDown={onKeyDown}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 1.25,
        width: "100%",
        minWidth: 0,
        minHeight: 46,
        p: compact ? "6px 8px 6px 12px" : "8px 10px 8px 14px",
        border: "1.5px solid",
        borderColor: reviewColor(review) ?? (overlay ? "primary.main" : tokens.color.border),
        borderRadius: `${tokens.radius.card}px`,
        bgcolor: review ? tokens.statusTint[review.right ? "success" : "error"].bg : "background.paper",
        color: "text.primary",
        typography: "body2",
        fontWeight: "fontWeightMedium",
        textAlign: "left",
        cursor: locked ? "default" : "grab",
        touchAction: "manipulation",
        opacity: dragging ? 0.3 : 1,
        ...(overlay ? { transform: "rotate(-1.5deg) scale(1.02)", boxShadow: tokens.shadow.float, cursor: "grabbing" } : null),
        "&.Mui-focusVisible": { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        "@media (prefers-reduced-motion: no-preference)": {
          transition: `border-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}, background-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
        },
      }}
    >
      <SequenceInlineImage image={item.image} label={item.label} />
      <Box component="span" sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
        {item.label}
      </Box>
      {wrong ? (
        <Box component="span" id={captionId} sx={{ flex: "none", color: "error.main", fontWeight: "fontWeightBold" }}>
          {`đúng: ${review.correctAt}`}
        </Box>
      ) : null}
      <DragIndicatorIcon aria-hidden fontSize="small" sx={{ flex: "none", color: "text.secondary" }} />
    </ButtonBase>
  );
}
