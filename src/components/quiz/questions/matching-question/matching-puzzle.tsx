import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

import { PUZZLE, rowAtPoint } from "./puzzle-geometry";
import { PuzzlePiece } from "./puzzle-piece";

export type PuzzleRow = {
  id: string;
  pieceId: string | null;
  left: ReactNode;
  right: ReactNode;
  rightName: string;
  connected: boolean;
  state?: "correct" | "wrong" | "missing";
  trailing?: ReactNode;
};

type Props = { rows: PuzzleRow[]; mode: "learner" | "author"; locked?: boolean; onDrop: (from: number, to: number | null) => void };
type MoveKey = (event: KeyboardEvent, index: number) => void;

const GripDots = () => (
  <Box component="svg" aria-hidden viewBox="0 0 10 16" sx={{ width: 10, height: 16, flex: "none", color: "text.secondary" }}>
    {[3, 8, 13].flatMap((cy) => [2, 8].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} fill="currentColor" />))}
  </Box>
);

function LeftCell({ row }: { row: PuzzleRow }) {
  const { isOver, setNodeRef } = useDroppable({ id: row.id });
  const tone = isOver ? "over" : row.state === "missing" ? "idle" : (row.state ?? "idle");
  return (
    <Box ref={setNodeRef} data-row-id={row.id}>
      <PuzzlePiece side="left" tone={tone}>{row.left}</PuzzlePiece>
    </Box>
  );
}

function RightCell({ row, index, mode, locked, onMoveKey }: { row: PuzzleRow & { pieceId: string }; index: number; mode: Props["mode"]; locked: boolean; onMoveKey: MoveKey }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: row.pieceId, disabled: locked });
  const learner = mode === "learner";
  const activator = { ...attributes, ...listeners, onKeyDown: (event: KeyboardEvent) => onMoveKey(event, index) };
  return (
    <Box
      ref={setNodeRef}
      {...(learner
        ? {
            ...activator,
            role: "button", tabIndex: 0,
            "aria-label": `Mảnh ${row.rightName}, dòng ${index + 1}, ${row.connected ? "đã ghép" : "chưa ghép"}`,
            "aria-disabled": locked,
            "data-piece-id": row.pieceId, "data-piece-row": row.id,
          }
        : {})}
      sx={{
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
      <PuzzlePiece side="right" tone={row.state ?? "idle"}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{row.right}</Box>
        {learner ? (
          <GripDots />
        ) : (
          <IconButton
            ref={setActivatorNodeRef}
            {...activator}
            size="small"
            aria-label={`Kéo vế phải dòng ${index + 1}, Alt+mũi tên để đổi dòng`}
            data-grip-row={row.id}
            disabled={locked}
            sx={{ cursor: "grab", touchAction: "manipulation" }}
          >
            <GripDots />
          </IconButton>
        )}
      </PuzzlePiece>
    </Box>
  );
}

/** The shared matching board: left pieces are drop rows, right pieces are dragged between rows (spec 7.1). */
export function MatchingPuzzle({ rows, mode, locked = false, onDrop }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  // Moving swaps DOM content under a fixed row, so focus is put back once the moved piece has rendered in its new row.
  useEffect(() => {
    if (!pendingFocus) return;
    const target = gridRef.current?.querySelector<HTMLElement>(pendingFocus);
    if (!target) return;
    target.focus();
    setPendingFocus(null);
  }, [pendingFocus, rows]);

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
    const target = rows[to].id;
    setPendingFocus(learner ? `[data-piece-row="${target}"][data-piece-id="${rows[index].pieceId}"]` : `[data-grip-row="${target}"]`);
  };

  const activeRow = activeId ? rows.find((row) => row.pieceId === activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ screenReaderInstructions: { draggable: mode === "learner" ? "Enter hoặc Space để ghép hoặc tách, mũi tên lên xuống để đổi dòng." : "Alt+mũi tên lên xuống để đổi dòng." } }}
      collisionDetection={collision}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Box
          ref={gridRef}
          sx={{ display: "grid", gridTemplateColumns: "26px max-content max-content auto", rowGap: 1.75, alignItems: "stretch", width: "max-content" }}
        >
          {rows.map((row, index) => (
            <Fragment key={row.id}>
              <Box sx={{ typography: "caption", fontFamily: tokens.font.mono, color: "text.secondary", alignSelf: "center" }}>{index + 1}</Box>
              <LeftCell row={row} />
              {row.pieceId ? (
                <RightCell key={row.id} row={{ ...row, pieceId: row.pieceId }} index={index} mode={mode} locked={locked} onMoveKey={handleMoveKey} />
              ) : (
                <Box key={row.id} />
              )}
              <Box sx={{ alignSelf: "center", pl: 1.5, minWidth: 60 }}>{row.trailing}</Box>
            </Fragment>
          ))}
        </Box>
      </Box>
      <DragOverlay>
        {activeRow ? (
          <PuzzlePiece side="right" tone="idle" sx={{ transform: "rotate(-2deg) scale(1.03)", filter: "drop-shadow(0 12px 16px rgba(16, 24, 40, 0.16))" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>{activeRow.right}</Box>
            <GripDots />
          </PuzzlePiece>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
