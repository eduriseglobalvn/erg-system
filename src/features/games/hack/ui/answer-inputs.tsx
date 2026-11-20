import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useState } from "react";

import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { hk } from "@/features/games/hack/hack-tokens";
import { evalScratch, formatScratch } from "@/features/games/hack/scratchpad";

const c = hk.color;
const focusSx = { "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" } };

type BodyProps = { question: Question; value: AnswerPayload; onChange: (next: AnswerPayload) => void; phone: boolean; locked: boolean };

/** Multiple response: "[x] / [ ]" toggles (HQMulti / HPQMulti). Same AnswerPayload (choiceIds) as the shared component. */
export function MultiChoiceButtons({ question, value, onChange, phone, locked }: BodyProps) {
  const ids = value.choiceIds ?? [];
  return (
    <Box role="group" aria-label="Các đáp án" sx={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: phone ? "8px" : "12px" }}>
      {(question.choices ?? []).map((choice, index) => {
        const on = ids.includes(choice.id);
        return (
          <ButtonBase
            key={choice.id}
            disabled={locked}
            aria-pressed={on}
            onClick={() => onChange({ choiceIds: on ? ids.filter((id) => id !== choice.id) : [...ids, choice.id] })}
            sx={{ minHeight: phone ? "52px" : "72px", border: `2px solid ${on ? c.green : c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: on ? c.selected : c.bg, color: on ? c.white : c.text, fontFamily: "inherit", fontSize: phone ? hk.fs[17] : hk.fs[20], fontWeight: hk.font.weightBold, justifyContent: "flex-start", textAlign: "left", padding: phone ? "0 12px" : "0 16px", gap: phone ? "10px" : "14px", ...focusSx }}
          >
            <Box component="span" sx={{ color: on ? c.green : c.dim }}>{on ? "[x]" : "[ ]"}</Box>
            <Box component="span" sx={{ fontSize: phone ? hk.fs[13] : hk.fs[15], color: c.dim }}>{String.fromCharCode(65 + index)}</Box>
            <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{choice.label}</Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

type FieldProps = { id: string; value: string; onChange: (next: string) => void; locked: boolean; size: number; minHeight: number; width?: string; padding: string; inputMode?: "text" | "none" | "decimal" };

/** "> text" answer box; a real input sits inside so the keyboard, paste and screen readers work. */
function PromptField({ id, value, onChange, locked, size, minHeight, width, padding, inputMode = "text" }: FieldProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "14px", boxSizing: "border-box", flex: width ? undefined : 1, width, minHeight: `${minHeight}px`, padding, border: `2px solid ${c.green}`, borderRadius: `${hk.radius.panel}px`, bgcolor: c.bg, color: c.white, fontSize: size, fontWeight: hk.font.weightBold }}>
      <Box component="span" aria-hidden="true" sx={{ color: c.green }}>&gt;</Box>
      <Box
        component="input"
        id={id}
        value={value}
        disabled={locked}
        inputMode={inputMode}
        readOnly={inputMode === "none"}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        sx={{ flex: 1, minWidth: 0, border: 0, outline: 0, bgcolor: "transparent", color: "inherit", font: "inherit", caretColor: c.green, padding: 0 }}
      />
    </Box>
  );
}

/** Short answer (HQShort / HPQShort). */
export function ShortAnswerField({ question, value, onChange, phone, locked }: BodyProps) {
  const blank = question.textBlanks?.[0];
  if (!blank) return null;
  return (
    <>
      <Box component="label" htmlFor="short-answer" sx={{ fontSize: hk.fs[12], fontWeight: hk.font.weightBold, color: c.dim }}>GÕ CÂU TRẢ LỜI</Box>
      <Box sx={{ display: "flex" }}>
        <PromptField id="short-answer" value={value.textResponses?.[blank.id] ?? ""} onChange={(text) => onChange({ textResponses: { [blank.id]: text } })} locked={locked} size={phone ? hk.fs[26] : hk.fs[40]} minHeight={phone ? 64 : 96} padding={phone ? "0 14px" : "0 22px"} />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: phone ? hk.fs[12] : hk.fs[13], color: c.mint }}>
        <span>[i] không phân biệt hoa thường{phone ? ", bỏ khoảng trắng thừa" : ""}</span>
        {phone ? null : <><span>[i] bỏ qua khoảng trắng thừa</span><span>[i] giáo viên có thể khai báo nhiều cách viết đúng</span></>}
      </Box>
    </>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0"];
const keySx = { minHeight: "52px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, bgcolor: c.bg, color: c.text, fontFamily: "inherit", fontSize: hk.fs[22], fontWeight: hk.font.weightBold, ...focusSx };

/** Numeric (HQNumeric / HPQNumeric): big result box plus a scratchpad on desktop, an on-screen keypad on phone. */
export function NumericField({ question, value, onChange, phone, locked }: BodyProps) {
  const [scratch, setScratch] = useState("");
  const unit = question.numericAnswer?.unit;
  const current = value.numericValue ?? "";
  const scratchValue = evalScratch(scratch);
  return (
    <>
      {phone ? null : <Box component="label" htmlFor="num-answer" sx={{ fontSize: hk.fs[12], fontWeight: hk.font.weightBold, color: c.dim }}>KẾT QUẢ</Box>}
      <Box sx={{ display: "flex", gap: phone ? "8px" : "14px", alignItems: "stretch" }}>
        <PromptField id="num-answer" value={current} onChange={(text) => onChange({ numericValue: text.replace(/[^\d,.-]/g, "") })} locked={locked} size={phone ? hk.fs[34] : hk.fs[52]} minHeight={phone ? 64 : 96} width={phone ? undefined : "360px"} padding={phone ? "0 14px" : "0 22px"} inputMode={phone ? "none" : "decimal"} />
        {unit ? <Box sx={{ display: "flex", alignItems: "center", padding: phone ? "0 14px" : "0 22px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.panel}px`, fontSize: phone ? hk.fs[17] : hk.fs[24], fontWeight: hk.font.weightBold, color: c.dim }}>{unit}</Box> : null}
      </Box>
      {phone ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
          {KEYS.map((key) => (
            <ButtonBase key={key} disabled={locked} onClick={() => onChange({ numericValue: current + key })} sx={keySx}>{key}</ButtonBase>
          ))}
          <ButtonBase disabled={locked} onClick={() => onChange({ numericValue: current.slice(0, -1) })} sx={{ ...keySx, color: c.yellow }}>XÓA</ButtonBase>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: "20px", fontSize: hk.fs[13], color: c.mint }}>
            <span>[i] chỉ nhận chữ số, dấu phẩy và dấu trừ</span>
            <span>[i] câu có sai số cho phép thì ghi rõ ở đề</span>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", fontSize: hk.fs[14], color: c.dim }}>
            <Box component="label" htmlFor="num-scratch" sx={{ fontWeight: hk.font.weightBold }}>Ô NHÁP</Box>
            <Box component="input" id="num-scratch" value={scratch} disabled={locked} placeholder="2 × 1 024 ÷ 250" autoComplete="off" onChange={(event) => setScratch(event.target.value)} sx={{ width: "260px", border: `1px solid ${c.border}`, borderRadius: `${hk.radius.chip}px`, bgcolor: c.bg, color: c.text, font: "inherit", padding: "6px 10px", "&:focus": { outline: `2px solid ${c.green}` } }} />
            <Box component="span" sx={{ color: c.yellow }}>{scratchValue === null ? "" : `= ${formatScratch(scratchValue)}`}</Box>
          </Box>
        </>
      )}
    </>
  );
}
