import {
  DndContext,
  DragOverlay,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

import { puzzleAnnouncements } from "./matching-board";
import { PUZZLE, pieceMaxWidthFor, rowAtPoint } from "./puzzle-geometry";
import { NonTouchPointerSensor } from "./non-touch-pointer-sensor";
import { GripDots, GripHandle, PuzzlePiece } from "./puzzle-piece";

export type PuzzleRow = {
  id: string;
  pieceId: string | null;
  left: ReactNode;
  right: ReactNode;
  rightName: string;
  connected: boolean;
  state?: "correct" | "wrong" | "missing";
  /** Review: the 1-based left row this right piece belongs to, shown as a number matching the row numbers. */
  answerNo?: number;
  trailing?: ReactNode;
};

// Below this board width the verdict column would push the pieces off a phone screen; colour and numbers carry the verdict there.
const TRAILING_MIN_BOARD = 560;

/** A row number in a circle: plain for the left rows, coloured by verdict on a reviewed right piece. */
function RowNumber({ n, tone }: { n: number; tone?: PuzzleRow["state"] }) {
  const color = tone === "correct" ? "success.main" : tone === "wrong" ? "error.main" : tone === "missing" ? "warning.main" : undefined;
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        typography: "caption",
        alignItems: "center",
        bgcolor: color ?? "background.paper",
        border: "1.5px solid",
        borderColor: color ?? tokens.color.borderStrong,
        borderRadius: `${tokens.radius.chip}px`,
        color: color ? "common.white" : "text.secondary",
        display: "inline-flex",
        flex: "none",
        fontVariantNumeric: "tabular-nums",
        fontWeight: "fontWeightBold",
        height: 22,
        justifyContent: "center",
        minWidth: 22,
      }}
    >
      {n}
    </Box>
  );
}

type Props = { rows: PuzzleRow[]; mode: "learner" | "author"; locked?: boolean; onDrop: (from: number, to: number | null) => void };
type MoveKey = (event: KeyboardEvent, index: number) => void;

function LeftCell({ row, maxWidth }: { row: PuzzleRow; maxWidth: number }) {
  const { isOver, setNodeRef } = useDroppable({ id: row.id });
  // display grid stretches the piece to the row height, so a wrapped row draws both pieces with the same h
  return (
    <Box ref={setNodeRef} sx={{ display: "grid" }}>
      <PuzzlePiece side="left" tone={isOver ? "over" : (row.state ?? "idle")} maxWidth={maxWidth}>{row.left}</PuzzlePiece>
    </Box>
  );
}

function RightCell({ row, index, mode, locked, maxWidth, onMoveKey }: { row: PuzzleRow & { pieceId: string }; index: number; maxWidth: number; mode: Props["mode"]; locked: boolean; onMoveKey: MoveKey }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: row.pieceId, disabled: locked, attributes: { roleDescription: "mảnh ghép" } });
  const learner = mode === "learner";
  const activator = { ...attributes, ...listeners, onKeyDown: (event: KeyboardEvent) => onMoveKey(event, index) };
  return (
    <Box
      ref={setNodeRef}
      {...(learner
        ? {
            ...activator,
            role: "button", tabIndex: 0,
            "aria-label": `Mảnh ${row.rightName}, hàng ${index + 1}, ${row.connected ? "đã ghép" : "chưa ghép"}${row.answerNo ? `, thuộc hàng ${row.answerNo}` : ""}`,
            "aria-disabled": locked,
            "data-piece-id": row.pieceId, "data-focus-row": row.id,
          }
        : {})}
      sx={{
        display: "grid",
        position: "relative",
        ml: `${PUZZLE.gap}px`,
        transform: row.connected ? `translateX(-${PUZZLE.gap + PUZZLE.knob}px)` : "none",
        opacity: isDragging ? 0.3 : 1,
        cursor: learner && !locked ? "grab" : undefined,
        touchAction: "manipulation",
        borderRadius: `${tokens.radius.control}px`,
        "&:focus-visible": { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        "@media (prefers-reduced-motion: no-preference)": {
          transition: `transform ${tokens.motion.duration.base}ms ${tokens.motion.easing.emphasized}`,
        },
      }}
    >
      <PuzzlePiece side="right" tone={row.state ?? "idle"} maxWidth={maxWidth}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{row.right}</Box>
        {learner ? (
          locked ? <GripDots /> : <GripHandle />
        ) : (
          <IconButton
            ref={setActivatorNodeRef}
            {...activator}
            size="small"
            aria-label={`Kéo vế phải hàng ${index + 1}, Alt+mũi tên để đổi hàng`}
            data-focus-row={row.id}
            disabled={locked}
            sx={{ cursor: "grab", touchAction: "manipulation" }}
          >
            <GripDots />
          </IconButton>
        )}
      </PuzzlePiece>
      {/* A corner badge, so the verdict number takes no width from the text on a phone. */}
      {row.answerNo ? (
        <Box aria-hidden sx={{ position: "absolute", top: -9, right: -7, lineHeight: 0, borderRadius: `${tokens.radius.chip}px`, boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}` }}>
          <RowNumber n={row.answerNo} tone={row.state} />
        </Box>
      ) : null}
    </Box>
  );
}

/** The shared matching board: left pieces are drop rows, right pieces are dragged between rows (spec 7.1). */
export function MatchingPuzzle({ rows, mode, locked = false, onDrop }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 0 = not measured (first paint, jsdom): pieces keep the web cap until the box reports a width.
  const [boxWidth, setBoxWidth] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingFocus = useRef<{ row: string; piece?: string; rows: PuzzleRow[] } | null>(null);
  const sensors = useSensors(
    useSensor(NonTouchPointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const measure = () => setBoxWidth(node.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // The verdict column only exists once some row has a verdict, so a plain learner board gets the width back.
  const hasTrailing = rows.some((row) => row.trailing) && (boxWidth === 0 || boxWidth >= TRAILING_MIN_BOARD);
  const maxWidth = boxWidth > 0 ? pieceMaxWidthFor(boxWidth - PUZZLE.numberColumn - (hasTrailing ? 72 : 0)) : PUZZLE.maxWidth;

  // A move swaps content under fixed rows, so focus follows the piece once the next rows render; a rejected move matches nothing.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || pending.rows === rows) return;
    pendingFocus.current = null;
    const cells = Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-focus-row]") ?? []);
    cells.find((cell) => cell.dataset.focusRow === pending.row && cell.dataset.pieceId === pending.piece)?.focus();
  }, [rows]);

  const collision: CollisionDetection = ({ pointerCoordinates, droppableRects }) => {
    const grid = gridRef.current?.getBoundingClientRect();
    if (!pointerCoordinates || !grid) return [];
    const rects = rows.flatMap((row) => {
      const rect = droppableRects.get(row.id);
      return rect ? [{ id: row.id, top: rect.top, bottom: rect.bottom }] : [];
    });
    const id = rowAtPoint(pointerCoordinates, rects, grid);
    return id ? [{ id }] : [];
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const from = rows.findIndex((row) => row.pieceId === active.id);
    if (from === -1) return;
    const to = over ? rows.findIndex((row) => row.id === over.id) : -1;
    onDrop(from, to === -1 ? null : to);
  }

  const handleMoveKey: MoveKey = (event, index) => {
    if (locked || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const learner = mode === "learner";
    if (learner && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onDrop(index, index);
      return;
    }
    if ((event.key !== "ArrowUp" && event.key !== "ArrowDown") || (!learner && !event.altKey)) return;
    event.preventDefault();
    const to = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (to < 0 || to >= rows.length) return;
    onDrop(index, to);
    pendingFocus.current = { row: rows[to].id, piece: learner ? (rows[index].pieceId ?? undefined) : undefined, rows };
  };

  const activeRow = activeId ? rows.find((row) => row.pieceId === activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements: puzzleAnnouncements(rows),
        screenReaderInstructions: { draggable: mode === "learner" ? "Enter hoặc Space để ghép hoặc tách, mũi tên lên xuống để đổi hàng." : "Alt+mũi tên lên xuống để đổi hàng." },
      }}
      collisionDetection={collision}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <Box ref={scrollRef} sx={{ overflowX: "auto" }}>
        <Box
          ref={gridRef}
          sx={{ display: "grid", gridTemplateColumns: `${PUZZLE.numberColumn}px max-content max-content${hasTrailing ? " auto" : ""}`, rowGap: 1.75, alignItems: "stretch", width: "max-content", mx: "auto" }}
        >
          {rows.map((row, index) => (
            <Fragment key={row.id}>
              <Box sx={{ alignSelf: "center" }}><RowNumber n={index + 1} /></Box>
              <LeftCell row={row} maxWidth={maxWidth} />
              {row.pieceId ? (
                <RightCell key={row.id} row={{ ...row, pieceId: row.pieceId }} index={index} mode={mode} locked={locked} maxWidth={maxWidth} onMoveKey={handleMoveKey} />
              ) : (
                <Box key={row.id} />
              )}
              {hasTrailing ? <Box sx={{ alignSelf: "center", pl: 1.5, minWidth: 60 }}>{row.trailing}</Box> : null}
            </Fragment>
          ))}
        </Box>
      </Box>
      <DragOverlay>
        {activeRow ? (
          <PuzzlePiece side="right" tone="idle" maxWidth={maxWidth} sx={{ transform: "rotate(-2deg) scale(1.03)", filter: `drop-shadow(${tokens.shadow.md})` }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>{activeRow.right}</Box>
            <GripDots />
          </PuzzlePiece>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
