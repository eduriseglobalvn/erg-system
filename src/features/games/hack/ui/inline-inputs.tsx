import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { Fragment, useState } from "react";

import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { hk } from "@/features/games/hack/hack-tokens";

const c = hk.color;
const focusSx = { "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" } };

type BodyProps = { question: Question; value: AnswerPayload; onChange: (next: AnswerPayload) => void; phone: boolean; locked: boolean };

function setBlank(value: AnswerPayload, id: string, option: string): AnswerPayload {
  return { inlineSelections: { ...(value.inlineSelections ?? {}), [id]: option } };
}

/** Inline choice (HQInlineChoice / HPQInlineChoice): pills inside the sentence, one open list at a time; on phone the list is a sheet at the foot of the panel. */
export function InlineChoiceBody({ question, value, onChange, phone, locked }: BodyProps) {
  const blanks = question.inlineBlanks ?? [];
  const [openId, setOpenId] = useState<string | null>(blanks[0]?.id ?? null);
  const openIndex = blanks.findIndex((blank) => blank.id === openId);
  const open = openIndex >= 0 ? blanks[openIndex] : null;

  const choose = (option: string) => {
    if (!open) return;
    onChange(setBlank(value, open.id, option));
    const filled = { ...(value.inlineSelections ?? {}), [open.id]: option };
    // Jump to the next blank that is still empty, like the design says; close the list after the last one.
    const next = [...blanks.slice(openIndex + 1), ...blanks.slice(0, openIndex)].find((blank) => !filled[blank.id]);
    setOpenId(next?.id ?? null);
  };

  const pill = (blank: (typeof blanks)[number]) => {
    const picked = value.inlineSelections?.[blank.id];
    const active = blank.id === openId;
    return (
      <ButtonBase
        key={`pill-${blank.id}`}
        disabled={locked}
        aria-expanded={active}
        aria-label={blank.statement}
        onClick={() => setOpenId(active ? null : blank.id)}
        sx={{ display: "inline-flex", verticalAlign: "middle", gap: "8px", minHeight: "44px", padding: "0 10px", margin: "2px 0", border: `2px solid ${picked ? c.cyan : active ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: !picked && active ? c.selected : c.bg, color: picked ? c.white : c.dim, fontFamily: "inherit", fontSize: phone ? hk.fs[14] : hk.fs[20], fontWeight: hk.font.weightBold, ...focusSx }}
      >
        {picked ?? "chọn"}
        <Box component="span" aria-hidden="true" sx={{ color: active && !picked ? c.green : c.dim }}>v</Box>
      </ButtonBase>
    );
  };

  const list = open ? (
    <Box role="listbox" aria-label={`Chỗ ${openIndex + 1}`} sx={{ bgcolor: c.bg, ...(phone ? { marginTop: "auto" } : { width: "300px", border: `2px solid ${c.green}` }), display: "flex", flexDirection: "column" }}>
      {phone ? <Box sx={{ fontSize: hk.fs[12], color: c.dim, padding: "10px 14px" }}>CHỖ {openIndex + 1}/{blanks.length} · chạm để chọn</Box> : null}
      {open.options.map((option) => {
        const on = value.inlineSelections?.[open.id] === option;
        return (
          <ButtonBase key={option} role="option" aria-selected={on} disabled={locked} onClick={() => choose(option)} sx={{ minHeight: "48px", padding: "0 14px", justifyContent: "flex-start", bgcolor: on ? c.green : "transparent", color: on ? c.bg : c.text, fontFamily: "inherit", fontSize: hk.fs[16], fontWeight: hk.font.weightBold, textAlign: "left", ...focusSx }}>{option}</ButtonBase>
        );
      })}
      {phone ? <Box sx={{ fontSize: hk.fs[12], color: c.dim, padding: "10px 14px" }}>Bảng trượt từ dưới lên, vừa ngón tay cái. Chọn xong tự nhảy sang chỗ kế.</Box> : null}
    </Box>
  ) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, minHeight: 0 }}>
      <Box sx={{ fontSize: phone ? hk.fs[15] : hk.fs[22], lineHeight: phone ? 2.4 : 2.2 }}>
        {blanks.map((blank, index) => (
          <Fragment key={blank.id}>
            {index > 0 ? " " : null}
            {blank.selectPosition !== "after" ? <>{pill(blank)} </> : null}
            {blank.statement}
            {blank.selectPosition === "after" ? <> {pill(blank)}</> : null}
            {blank.suffix ? `${/^[,.;:!?]/.test(blank.suffix) ? "" : " "}${blank.suffix}` : null}
          </Fragment>
        ))}
      </Box>
      {list}
    </Box>
  );
}

/** Select from lists (HQSelectLists / HPQSelectLists): one row per statement, every option a button. */
export function SelectListsBody({ question, value, onChange, phone, locked }: BodyProps) {
  // The first row still waiting for an answer gets the amber outline, as on the board.
  const firstEmpty = (question.inlineBlanks ?? []).find((blank) => !value.inlineSelections?.[blank.id])?.id;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: phone ? "8px" : "10px" }}>
      {(question.inlineBlanks ?? []).map((blank) => (
        <Box key={blank.id} role="group" aria-label={blank.statement} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: phone ? "6px 12px" : "16px", bgcolor: c.bg, border: `1px solid ${blank.id === firstEmpty ? c.yellow : c.border}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "8px" : "8px 14px" }}>
          <Box component="span" sx={{ fontSize: phone ? hk.fs[15] : hk.fs[19], width: phone ? "auto" : "220px", color: c.white }}>{blank.statement}</Box>
          {phone ? null : <Box component="span" aria-hidden="true" sx={{ color: c.dim }}>=&gt;</Box>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {blank.options.map((option) => {
              const on = value.inlineSelections?.[blank.id] === option;
              return (
                <ButtonBase key={option} disabled={locked} aria-pressed={on} onClick={() => onChange(setBlank(value, blank.id, option))} sx={{ minHeight: phone ? "44px" : "48px", padding: "0 12px", border: `2px solid ${on ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: on ? c.green : c.bg, color: on ? c.bg : c.text, fontFamily: "inherit", fontSize: phone ? hk.fs[14] : hk.fs[16], fontWeight: hk.font.weightBold, ...focusSx }}>{option}</ButtonBase>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
