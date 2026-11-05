import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { addBlank, blankWord, rebaseBlanks, removeBlank, type BlankSentence } from "./blank-sentence";
import { SentenceBackdrop } from "./sentence-backdrop";
import { newRowId } from "./sortable-rows";

const visuallyHidden = { border: 0, clip: "rect(0 0 0 0)", height: 1, margin: -1, overflow: "hidden", p: 0, position: "absolute", whiteSpace: "nowrap", width: 1 } as const;

const fieldSx = { p: 0, font: "inherit", lineHeight: "inherit", letterSpacing: "inherit", bgcolor: "transparent", position: "relative", zIndex: 1 } as const;

const PASTED = new Set(["insertFromPaste", "insertFromDrop"]);

// One line only. Pasted text goes to NFC so a blank's offsets never split a base letter from its combining mark;
// typed text is left alone because Unikey's combining mode deletes decomposed characters one by one.
const clean = (s: string, pasted: boolean) => {
  const line = s.replace(/\s*\r?\n\s*/g, " ");
  return pasted ? line.normalize("NFC") : line;
};

export function SentenceBuilder({ sentence, onChange, blankStyle, badge, hint, renderPopover }: {
  sentence: BlankSentence;
  onChange: (next: BlankSentence) => void;
  /** `underline` is the drag-words slot look. */
  blankStyle: "chip" | "underline";
  badge?: (blankId: string) => string | undefined;
  hint: string;
  /** Kind-specific content shown above "Bỏ ô trống". */
  renderPopover?: (blankId: string) => ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openBlank = sentence.blanks.find((b) => b.id === openId);
  // The popover closes by itself when its blank is gone (removed, or its word deleted).
  if (openId && !openBlank) setOpenId(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const descId = useId();
  // A cleaned value differs from what the textarea holds, so React would drop the caret at the end; put it back.
  // Only on the render that shows that value: a parent that hasn't applied it yet drops the restore.
  const caretAfter = useRef<{ value: string; caret: number } | null>(null);
  useLayoutEffect(() => {
    const pending = caretAfter.current;
    caretAfter.current = null;
    if (pending && pending.value === sentence.text) inputRef.current?.setSelectionRange(pending.caret, pending.caret);
  });

  const spanOf = (id: string) =>
    Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-blank-id]") ?? []).find((el) => el.dataset.blankId === id);

  const edit = (el: HTMLTextAreaElement, inputType: string | undefined) => {
    const pasted = PASTED.has(inputType ?? "");
    const value = clean(el.value, pasted);
    const caret = clean(el.value.slice(0, el.selectionEnd), pasted).length;
    if (value !== el.value) caretAfter.current = { value, caret };
    onChange(rebaseBlanks(sentence, value, caret));
  };

  const create = () => {
    const el = inputRef.current;
    if (!el) return;
    const id = newRowId("blank");
    const next = addBlank(sentence, el.selectionStart, el.selectionEnd, id);
    if (!next) { toast.info("Hãy bôi đen một từ chưa là ô trống."); return; }
    onChange(next);
    const end = next.blanks.find((b) => b.id === id)!.end;
    el.focus();
    el.setSelectionRange(end, end);
  };

  const openAtCaret = (el: HTMLTextAreaElement) => {
    if (el.selectionStart !== el.selectionEnd) return;
    const hit = sentence.blanks.find((b) => b.start <= el.selectionStart && el.selectionStart <= b.end);
    if (hit) setOpenId(hit.id);
  };

  const openAtPoint = (x: number, y: number) => {
    const el = inputRef.current;
    if (!el || el.selectionStart !== el.selectionEnd) return;
    const hit = sentence.blanks.find((b) =>
      Array.from(spanOf(b.id)?.getClientRects() ?? []).some((r) => r.left <= x && x <= r.right && r.top <= y && y <= r.bottom));
    if (hit) setOpenId(hit.id);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box ref={rootRef} sx={{ position: "relative", typography: "body1", lineHeight: 2.3 }}>
        <SentenceBackdrop badge={badge} blankStyle={blankStyle} openId={openBlank ? openBlank.id : null} sentence={sentence} />
        <InputBase
          fullWidth
          inputProps={{ "aria-label": "Câu có ô trống", "aria-describedby": descId }}
          inputRef={inputRef}
          multiline
          onChange={(e) => edit(e.target as HTMLTextAreaElement, (e.nativeEvent as InputEvent).inputType)}
          onClick={(e) => openAtPoint(e.clientX, e.clientY)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
            e.preventDefault();
            openAtCaret(e.target as HTMLTextAreaElement);
          }}
          placeholder="Gõ cả câu, rồi bôi đen từ cần biến thành ô trống"
          sx={{ ...fieldSx, "& textarea": fieldSx }}
          value={sentence.text}
        />
        <Box component="span" id={descId} sx={visuallyHidden}>
          Bôi đen một từ rồi bấm Tạo ô trống. Đưa con trỏ vào một ô trống và nhấn Enter để mở ô đó.
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1.5 }}>
        <Button onClick={create} onMouseDown={(e) => e.preventDefault()} variant="text">Tạo ô trống</Button>
        <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>{hint}</Box>
      </Box>
      <Popover
        anchorEl={openBlank ? () => spanOf(openBlank.id) ?? rootRef.current! : null}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={() => setOpenId(null)}
        open={Boolean(openBlank)}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": openBlank ? `Ô trống “${blankWord(sentence, openBlank)}”` : undefined,
            sx: { borderRadius: `${tokens.radius.card}px`, boxShadow: tokens.shadow.float, p: "10px 12px", display: "flex", flexDirection: "column", gap: 1, maxWidth: 330 },
          },
        }}
      >
        {openBlank && renderPopover?.(openBlank.id)}
        <Button
          onClick={() => { if (openBlank) onChange(removeBlank(sentence, openBlank.id)); setOpenId(null); }}
          sx={{ alignSelf: "flex-start" }}
          variant="text"
        >
          Bỏ ô trống
        </Button>
      </Popover>
    </Box>
  );
}
