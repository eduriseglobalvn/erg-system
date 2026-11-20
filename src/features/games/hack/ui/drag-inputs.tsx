import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { Fragment, useState, type DragEvent } from "react";

import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { hk } from "@/features/games/hack/hack-tokens";

const c = hk.color;
const focusSx = { "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" } };

type BodyProps = { question: Question; value: AnswerPayload; onChange: (next: AnswerPayload) => void; phone: boolean; locked: boolean };

/** One tappable chip of the bank: green when held, dim when already placed. */
function BankChip({ label, held, used, disabled, phone, onPick, id }: { label: string; held: boolean; used: boolean; disabled: boolean; phone: boolean; onPick: () => void; id: string }) {
  return (
    <ButtonBase
      disabled={disabled}
      aria-pressed={held}
      draggable={!disabled && !used}
      onDragStart={(event: DragEvent) => event.dataTransfer.setData("text/plain", id)}
      onClick={onPick}
      sx={{ minHeight: "48px", padding: "0 14px", border: `2px solid ${held ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: held ? c.green : c.bg, color: held ? c.bg : used ? c.strike : c.text, fontFamily: "inherit", fontSize: phone ? hk.fs[14] : hk.fs[18], fontWeight: hk.font.weightBold, ...focusSx }}
    >
      {label}
    </ButtonBase>
  );
}

const allow = (event: DragEvent) => event.preventDefault();

/** Drag words (HQDragWords / HPQDragWords): tap a word then a slot, or drag; tap a placed word to send it back. */
export function DragWordsBody({ question, value, onChange, phone, locked }: BodyProps) {
  const [held, setHeld] = useState<string | null>(null);
  const placements = value.dragWordPlacements ?? {};
  const slots = question.wordSlots ?? [];
  const bank = question.wordBank ?? [];
  const used = new Set(Object.values(placements));
  const labelOf = (id: string) => bank.find((word) => word.id === id)?.label ?? "";
  const firstEmpty = slots.find((slot) => !placements[slot.id])?.id;

  const place = (slotId: string, wordId: string) => {
    const next = Object.fromEntries(Object.entries(placements).filter(([, word]) => word !== wordId));
    onChange({ dragWordPlacements: { ...next, [slotId]: wordId } });
    setHeld(null);
  };
  const clear = (slotId: string) => {
    const next = { ...placements };
    delete next[slotId];
    onChange({ dragWordPlacements: next });
  };
  const distractors = Math.max(0, bank.length - slots.length);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Box sx={{ fontSize: phone ? hk.fs[15] : hk.fs[22], lineHeight: phone ? 2.4 : 2.2 }}>
        {slots.map((slot) => {
          const wordId = placements[slot.id];
          const target = !wordId && held && slot.id === firstEmpty;
          return (
            <Fragment key={slot.id}>
              {slot.label}{" "}
              <ButtonBase
                disabled={locked || (!wordId && !held)}
                aria-label={wordId ? `${labelOf(wordId)} (bấm để trả về kho)` : "Chỗ trống"}
                onClick={() => (wordId ? clear(slot.id) : held ? place(slot.id, held) : undefined)}
                onDragOver={allow}
                onDrop={(event: DragEvent) => place(slot.id, event.dataTransfer.getData("text/plain"))}
                sx={{ display: "inline-flex", verticalAlign: "middle", minHeight: "44px", padding: "0 10px", margin: "2px 0", border: `2px ${wordId ? "solid" : "dashed"} ${wordId ? c.cyan : target || held ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: wordId ? c.cyanPanel : c.bg, color: wordId ? c.white : c.dim, fontFamily: "inherit", fontSize: phone ? hk.fs[14] : hk.fs[20], fontWeight: hk.font.weightBold, "&.Mui-disabled": { color: wordId ? c.white : c.dim }, ...focusSx }}
              >
                {wordId ? labelOf(wordId) : held ? "thả vào đây" : "?"}
              </ButtonBase>
              {slot.suffix ? `${/^[,.;:!?]/.test(slot.suffix) ? "" : " "}${slot.suffix}` : null}{" "}
            </Fragment>
          );
        })}
      </Box>
      <Box sx={{ fontSize: hk.fs[12], color: c.dim }}>KHO TỪ{distractors > 0 ? ` · có ${distractors} từ gây nhiễu` : ""}</Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {bank.map((word) => (
          <BankChip key={word.id} id={word.id} label={word.label} held={held === word.id} used={used.has(word.id)} disabled={locked || used.has(word.id)} phone={phone} onPick={() => setHeld(held === word.id ? null : word.id)} />
        ))}
      </Box>
      {phone ? <Box sx={{ fontSize: hk.fs[12], color: c.dim }}>Trên điện thoại: chạm từ{held ? ` (đang cầm "${labelOf(held)}")` : ""} rồi chạm chỗ trống. Không cần kéo.</Box> : null}
    </Box>
  );
}

/** Drag and drop into groups (HQDragDrop / HPQDragDrop): tap an item then a group, or drag; tap a placed item to send it back. */
export function DragDropBody({ question, value, onChange, phone, locked }: BodyProps) {
  const [held, setHeld] = useState<string | null>(null);
  const placements = value.dragDropPlacements ?? {};
  const items = question.dragDropItems ?? [];
  const targets = question.dropTargets ?? [];
  const labelOf = (id: string) => items.find((item) => item.id === id)?.label ?? "";

  const place = (targetId: string, itemId: string) => {
    if (!items.some((item) => item.id === itemId)) return;
    onChange({ dragDropPlacements: { ...placements, [itemId]: targetId } });
    setHeld(null);
  };
  const back = (itemId: string) => {
    const next = { ...placements };
    delete next[itemId];
    onChange({ dragDropPlacements: next });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {items.map((item) => (
          <BankChip key={item.id} id={item.id} label={item.label} held={held === item.id} used={Boolean(placements[item.id])} disabled={locked || Boolean(placements[item.id])} phone={phone} onPick={() => setHeld(held === item.id ? null : item.id)} />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: phone ? "10px" : "16px" }}>
        {targets.map((target) => {
          const inside = items.filter((item) => placements[item.id] === target.id);
          const ready = Boolean(held);
          return (
            <Box
              key={target.id}
              role="group"
              aria-label={target.label}
              onClick={() => (held ? place(target.id, held) : undefined)}
              onDragOver={allow}
              onDrop={(event: DragEvent) => place(target.id, event.dataTransfer.getData("text/plain"))}
              sx={{ flex: 1, minWidth: 0, minHeight: phone ? "110px" : "190px", boxSizing: "border-box", border: `2px ${ready ? "dashed" : "solid"} ${ready ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: ready ? c.selected : c.bg, padding: "10px", display: "flex", flexDirection: "column", gap: "8px", cursor: ready ? "pointer" : "default" }}
            >
              <Box sx={{ fontSize: phone ? hk.fs[12] : hk.fs[14], fontWeight: hk.font.weightBold, color: ready ? c.green : c.cyan }}>{target.label}{ready ? " · thả vào đây" : ""}</Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {inside.map((item) => (
                  <ButtonBase key={item.id} disabled={locked} aria-label={`${labelOf(item.id)} (bấm để trả về)`} onClick={(event) => { event.stopPropagation(); back(item.id); }} sx={{ padding: phone ? "6px 8px" : "8px 12px", border: `1px solid ${c.cyan}`, bgcolor: c.cyanPanel, color: c.white, fontFamily: "inherit", fontSize: phone ? hk.fs[13] : hk.fs[16], ...focusSx }}>{item.label}</ButtonBase>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      {phone ? <Box sx={{ fontSize: hk.fs[12], color: c.dim }}>Chạm thiết bị{held ? ` (đang cầm "${labelOf(held)}")` : ""} rồi chạm nhóm.</Box> : null}
    </Box>
  );
}

/** Sequence (HQSequence / HPQSequence): numbered rows with ^ v buttons; the payload is the same sequenceOrder as the shared component. */
export function SequenceBody({ question, value, onChange, phone, locked }: BodyProps) {
  const items = question.sequenceItems ?? [];
  const order = value.sequenceOrder?.length ? value.sequenceOrder : items.map((item) => item.id);
  const [last, setLast] = useState<string | null>(null);
  const labelOf = (id: string) => items.find((item) => item.id === id)?.label ?? "";

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[index], next[to]] = [next[to], next[index]];
    setLast(order[index]);
    onChange({ sequenceOrder: next });
  };
  const arrowSx = (active: boolean, off: boolean) => ({ flex: "none", width: "44px", height: "44px", border: `1px solid ${active ? c.green : c.border}`, borderRadius: `${hk.radius.chip}px`, color: off ? c.dim : active ? c.green : c.text, fontFamily: "inherit", fontSize: phone ? hk.fs[16] : hk.fs[18], fontWeight: hk.font.weightBold, ...focusSx });

  return (
    <Box component="ol" sx={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: phone ? "8px" : "10px", fontSize: phone ? hk.fs[14] : hk.fs[18] }}>
      {order.map((id, index) => {
        const active = id === last;
        return (
          <Box key={id} component="li" sx={{ display: "flex", alignItems: "center", gap: phone ? "8px" : "14px", minHeight: phone ? "56px" : "60px", padding: phone ? "0 6px 0 10px" : "0 12px 0 16px", border: `2px solid ${active ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: active ? c.selected : c.bg, color: active ? c.white : c.text }}>
            <Box component="span" sx={{ color: c.green }}>{String(index + 1).padStart(2, "0")}</Box>
            {phone ? null : <Box component="span" aria-hidden="true" sx={{ color: active ? c.green : c.dim }}>::</Box>}
            <Box component="span" sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{labelOf(id)}</Box>
            <ButtonBase aria-label={`Lên: ${labelOf(id)}`} disabled={locked || index === 0} onClick={() => move(index, -1)} sx={arrowSx(active, index === 0)}>^</ButtonBase>
            <ButtonBase aria-label={`Xuống: ${labelOf(id)}`} disabled={locked || index === order.length - 1} onClick={() => move(index, 1)} sx={arrowSx(active, index === order.length - 1)}>v</ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}
