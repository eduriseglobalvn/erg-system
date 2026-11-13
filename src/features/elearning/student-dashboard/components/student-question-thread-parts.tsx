import { useState } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui";
import { formatDateVi, formatListTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { QuestionMessage, QuestionThread } from "../api/student-question-thread-api";

/** "Hôm qua" / "Hôm nay · 07:55" / dd/MM/yyyy: the divider above a run of messages of one day. */
export function dayLabel(createdAt: string) {
  const short = formatListTimeVi(createdAt);
  return short.includes(":") ? `Hôm nay · ${short}` : short;
}

/** Answer line of the question card: "2x + 5 = 13 · bạn chọn x = 9 · đáp án x = 4"; the correct answer may be hidden (null). */
export function questionSummary(thread: Pick<QuestionThread, "questionPrompt" | "studentAnswerText" | "correctAnswerText">) {
  return [
    thread.questionPrompt,
    thread.studentAnswerText ? `bạn chọn ${thread.studentAnswerText}` : null,
    thread.correctAnswerText ? `đáp án ${thread.correctAnswerText}` : null,
  ].filter(Boolean).join(" · ");
}

export function QuestionCard({ thread, mobile = false, onOpen }: { thread: QuestionThread; mobile?: boolean; onOpen?: () => void }) {
  // The phone card (H12m) drops the "Luyện tập:" prefix and keeps only a chevron.
  const title = [mobile ? thread.assignmentTitle?.replace(/^Luyện tập:s*/u, "") : thread.assignmentTitle, `Câu ${thread.questionIndex}`].filter(Boolean).join(" · ");
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, bgcolor: "background.paper" }}>
      <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 32, height: 32, flexShrink: 0, borderRadius: `${t.radius.sm}px`, bgcolor: t.statusTint.info.bg, color: t.statusTint.info.dot }}>
        <CalculateRoundedIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" noWrap>{title}</Typography>
        <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>{questionSummary(thread)}</Typography>
      </Box>
      {onOpen && mobile ? (
        <IconButton aria-label="Mở câu hỏi" onClick={onOpen}><ChevronRightRoundedIcon /></IconButton>
      ) : onOpen ? (
        <ErgButton variant="text" size="small" endIcon={<ChevronRightRoundedIcon />} onClick={onOpen} aria-label="Mở câu hỏi">Mở câu hỏi</ErgButton>
      ) : null}
    </Box>
  );
}

export function MessageList({ messages, teacherInitials }: { messages: ReadonlyArray<QuestionMessage>; teacherInitials: string }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1.5 }}>
      {messages.map((message, index) => {
        const divider = index === 0 || formatDateVi(message.createdAt) !== formatDateVi(messages[index - 1].createdAt);
        return (
          <Box key={message.id} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 1.5 }}>
            {divider ? <Typography variant="caption" sx={{ justifySelf: "center", px: 1.25, py: 0.25, borderRadius: `${t.radius.chip}px`, bgcolor: t.color.surfaceMuted, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{dayLabel(message.createdAt)}</Typography> : null}
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", justifyContent: message.mine ? "flex-end" : "flex-start" }}>
              {message.mine ? null : (
                <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: "50%", bgcolor: t.statusTint.success.bg, color: t.statusTint.success.color }}>
                  <Typography variant="caption" sx={{ fontWeight: "fontWeightBold" }}>{teacherInitials}</Typography>
                </Box>
              )}
              <Typography
                variant="body2"
                aria-label={`${message.mine ? "Bạn" : message.senderName ?? "Giáo viên"}: ${message.body}`}
                sx={{
                  maxWidth: "80%", px: 1.75, py: 1.25, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
                  borderRadius: `${t.radius.xl}px`,
                  ...(message.mine
                    ? { bgcolor: "primary.main", color: "primary.contrastText", borderTopRightRadius: `${t.radius.xs}px` }
                    : { bgcolor: t.color.surfaceMuted, border: 1, borderColor: "divider", borderTopLeftRadius: `${t.radius.xs}px` }),
                }}
              >
                {message.body}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

type ComposerProps = { disabled: boolean; mobile: boolean; onSend: (text: string) => void };

/** Composer: web = pill field + outlined "Gửi"; phone (H12m) = round field + round primary send button. */
export function Composer({ disabled, mobile, onSend }: ComposerProps) {
  const [text, setText] = useState("");
  const submit = () => {
    const body = text.trim();
    if (!body || disabled) return;
    onSend(body);
    setText("");
  };
  return (
    <Box
      component="form"
      onSubmit={(event) => { event.preventDefault(); submit(); }}
      sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}
    >
      <InputBase
        fullWidth
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={mobile ? "Hỏi tiếp cô…" : "Viết câu hỏi tiếp cho cô…"}
        inputProps={{ "aria-label": "Tin nhắn cho giáo viên", maxLength: 2000 }}
        sx={{ minHeight: 44, px: 2, border: 1, borderColor: "divider", borderRadius: mobile ? "22px" : `${t.radius.lg}px` }}
      />
      {mobile ? (
        <IconButton type="submit" aria-label="Gửi" disabled={disabled} sx={{ width: 44, height: 44, bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } }}>
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      ) : (
        <ErgButton type="submit" variant="outlined" disabled={disabled || !text.trim()} startIcon={<SendRoundedIcon />}>Gửi</ErgButton>
      )}
    </Box>
  );
}
