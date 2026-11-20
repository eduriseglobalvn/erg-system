import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useCallback, useEffect, useMemo, useState } from "react";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { createInitialAnswer, isAnswerComplete, normalizeAnswerForSubmission } from "@/domain/quiz/quiz";
import type { LeaderboardData, PlayerState, QuestionPayload } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { answerProgress, echoCommand, footerHint, isTrueChoice, kindCopy, nextStarReward } from "@/features/games/hack/question-meta";
import { Chip, Cursor, HackButton, HackScreen, Panel } from "@/features/games/hack/ui/hack-ui";
import { HudBar, QuestionProgress } from "@/features/games/hack/ui/hud";
import { FeedPanel, LeaderboardPanel } from "@/features/games/hack/ui/side-panels";
import type { QuestionMark } from "@/features/games/room-state";

const c = hk.color;

type QuestionScreenProps = {
  phone: boolean;
  me: PlayerState;
  payload: QuestionPayload;
  marks: Record<number, QuestionMark>;
  getRemainingMs: (nowMs: number) => number;
  leaderboard: LeaderboardData | null;
  feed: { at: string; text: string; tone: string }[];
  /** Answer buttons stay locked while offline, paused, or after the answer was sent. */
  locked: boolean;
  onSubmit: (questionId: string, answer: AnswerPayload) => void;
};

const KEY_SELECTORS = "input, textarea, select, [contenteditable=true]";

/** Single choice and true/false: the design's big [A] buttons (same AnswerPayload as the shared SingleChoiceQuestion). */
function ChoiceButtons({ question, value, onChange, phone, locked }: { question: Question; value: AnswerPayload; onChange: (next: AnswerPayload) => void; phone: boolean; locked: boolean }) {
  const choices = question.choices ?? [];
  if (question.kind === "true_false") {
    return (
      <Box role="group" aria-label="Các đáp án" sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: phone ? "10px" : "16px", marginTop: phone ? 0 : "10px" }}>
        {choices.map((choice, index) => {
          const isTrue = isTrueChoice(choice.label, index);
          const selected = value.choiceId === choice.id;
          return (
            <ButtonBase
              key={choice.id}
              disabled={locked}
              aria-pressed={selected}
              onClick={() => onChange({ choiceId: choice.id })}
              sx={{
                minHeight: phone ? "120px" : "150px",
                border: `2px solid ${selected ? c.green : c.border}`,
                borderRadius: `${hk.radius.panel}px`,
                bgcolor: selected ? c.green : c.bg,
                color: selected ? c.bg : c.text,
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" },
              }}
            >
              <Box component="span" sx={{ fontSize: phone ? hk.fs[34] : hk.fs[44], fontWeight: hk.font.weightBold, color: selected ? c.bg : c.green }}>{isTrue ? "TRUE" : "FALSE"}</Box>
              <Box component="span" sx={{ fontSize: phone ? hk.fs[15] : hk.fs[18], fontWeight: hk.font.weightBold }}>
                [{isTrue ? "T" : "F"}] Mệnh đề {isTrue ? "ĐÚNG" : "SAI"}{selected ? " · đã chọn" : ""}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    );
  }
  return (
    <Box role="group" aria-label="Các đáp án" sx={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: phone ? "12px" : "12px" }}>
      {choices.map((choice, index) => {
        const selected = value.choiceId === choice.id;
        return (
          <ButtonBase
            key={choice.id}
            disabled={locked}
            aria-pressed={selected}
            onClick={() => onChange({ choiceId: choice.id })}
            sx={{
              minHeight: phone ? "64px" : "86px",
              border: `2px solid ${selected ? c.green : c.border}`,
              borderRadius: `${hk.radius.panel}px`,
              bgcolor: selected ? c.green : c.bg,
              color: selected ? c.bg : c.text,
              fontFamily: "inherit",
              fontSize: phone ? hk.fs[19] : hk.fs[22],
              fontWeight: hk.font.weightBold,
              textAlign: "left",
              padding: phone ? "0 14px" : "0 16px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: phone ? "12px" : "14px",
              "&.Mui-focusVisible": { outline: `2px solid ${c.white}`, outlineOffset: "2px" },
            }}
          >
            <Box component="span" sx={{ bgcolor: selected ? c.bg : c.selected, color: c.green, padding: phone ? "8px 10px" : "10px 12px", borderRadius: `${hk.radius.chip}px`, fontSize: phone ? hk.fs[15] : hk.fs[17] }}>
              [{String.fromCharCode(65 + index)}]
            </Box>
            <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere", textAlign: "left" }}>
              {choice.image ? <Box component="img" src={choice.image.url} alt={choice.image.alt ?? ""} sx={{ display: "block", maxHeight: "96px", maxWidth: "100%", marginBottom: "6px" }} /> : null}
              {choice.label}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/** 04 · Nhiệm vụ, all 13 kinds (HQuestion, HQ*, HPQuestion, HPQ*). */
export function QuestionScreen({ phone, me, payload, marks, getRemainingMs, leaderboard, feed, locked, onSubmit }: QuestionScreenProps) {
  const { question } = payload;
  const [value, setValue] = useState<AnswerPayload>(() => createInitialAnswer(question));
  const [sent, setSent] = useState(false);
  const copy = kindCopy(question.kind);
  const complete = isAnswerComplete(question, value);
  const disabled = locked || sent;
  const progress = answerProgress(question, value);
  const echo = echoCommand(question, value);
  const reward = nextStarReward(me.streak);
  const streakAfter = me.streak + 1;

  const run = useCallback(() => {
    if (disabled || !isAnswerComplete(question, value)) return;
    setSent(true);
    onSubmit(question.id, normalizeAnswerForSubmission(question, value));
  }, [disabled, onSubmit, question, value]);

  // Desktop shortcuts: A-D pick, T/F for true/false, A-F toggle for multiple, Enter runs. Ignored while typing.
  useEffect(() => {
    if (phone || disabled) return;
    const choices = question.choices ?? [];
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest(KEY_SELECTORS));
      const key = event.key.toLowerCase();
      if (key === "enter") {
        if (["single_choice", "true_false", "multiple_response", "short_answer", "numeric", "fill_blank"].includes(question.kind)) {
          event.preventDefault();
          run();
        }
        return;
      }
      if (typing) return;
      if (question.kind === "single_choice" && /^[a-d]$/.test(key)) {
        const choice = choices[key.charCodeAt(0) - 97];
        if (choice) setValue({ choiceId: choice.id });
      } else if (question.kind === "true_false" && (key === "t" || key === "f")) {
        const choice = choices.find((item, index) => isTrueChoice(item.label, index) === (key === "t"));
        if (choice) setValue({ choiceId: choice.id });
      } else if (question.kind === "multiple_response" && /^[a-f]$/.test(key)) {
        const choice = choices[key.charCodeAt(0) - 97];
        if (choice) {
          setValue((prev) => {
            const ids = prev.choiceIds ?? [];
            return { choiceIds: ids.includes(choice.id) ? ids.filter((id) => id !== choice.id) : [...ids, choice.id] };
          });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, phone, question, run]);

  const body = useMemo(
    () =>
      question.kind === "single_choice" || question.kind === "true_false" ? (
        <ChoiceButtons question={question} value={value} onChange={setValue} phone={phone} locked={disabled} />
      ) : (
        <Box
          sx={{
            // The shared question components hard-code light borders and surfaces; recolour them for the dark theme.
            "& .MuiButtonBase-root:not([aria-pressed='true'])": { borderColor: c.border },
            "& input, & textarea": { color: c.white, fontFamily: "inherit" },
          }}
        >
          <QuestionRenderer question={question} value={value} onChange={setValue} submitted={disabled} />
        </Box>
      ),
    [disabled, phone, question, value],
  );

  const titleSize = phone ? hk.fs[20] : copy.titleSize;
  const echoLine = echo !== null ? (
    <Box sx={{ flex: 1, fontSize: phone ? hk.fs[13] : hk.fs[14] }}>
      <Box component="span" sx={{ color: c.green }}>$</Box> {echo}<Cursor />
      {phone ? null : <Box component="span" sx={{ color: c.dim }}> · {footerHint(question)}</Box>}
    </Box>
  ) : (
    <Box sx={{ flex: 1, fontSize: phone ? hk.fs[12] : hk.fs[14], color: c.dim, lineHeight: phone ? 1.6 : undefined }}>{footerHint(question)}</Box>
  );
  const runButton = (
    <HackButton disabled={disabled || !complete} onClick={run} fullWidth={phone} fontSize={hk.fs[18]} minHeight={56} paddingX={36}>
      &gt; CHẠY LỆNH
    </HackButton>
  );
  const hintLine = `Đúng câu này: chuỗi x${streakAfter}${streakAfter >= 3 ? ", tường lửa " + (phone ? "bật" : "của bạn bật") : ""}.`;

  const missionLabel = `NHIỆM VỤ ${payload.index + 1}/${payload.total}`;

  if (phone) {
    return (
      <HackScreen phone label="Nhiệm vụ">
        <HudBar me={me} getRemainingMs={getRemainingMs} phone />
        <QuestionProgress total={payload.total} current={payload.index} marks={marks} phone />
        <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "12px", padding: "12px 14px 16px" }}>
          <Panel sx={{ padding: "14px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>
              <Chip color={c.green} solid sx={{ padding: "3px 8px" }}>{missionLabel}</Chip>
              {copy.chip ? <Chip color={c.cyan}>{copy.chip}</Chip> : null}
              <Box component="span" sx={{ color: progress ? c.yellow : c.cyan }}>{progress ?? `+${reward} sao · 1 gói`}</Box>
            </Box>
            <Box component="h2" sx={{ margin: "12px 0 0", fontSize: titleSize, lineHeight: 1.45, fontWeight: hk.font.weightBold, color: c.white }}>{question.title}</Box>
            {question.instructions ? <Box sx={{ marginTop: "6px", fontSize: hk.fs[13], color: c.dim }}>{question.instructions}</Box> : null}
          </Panel>
          {question.contentImage && question.kind !== "hotspot" ? <QuestionContentImage question={question} /> : null}
          {body}
          <Box sx={{ fontSize: hk.fs[12], lineHeight: 1.6, color: c.mint }}>{hintLine}</Box>
          <Box sx={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {echoLine}
            {runButton}
          </Box>
        </Box>
      </HackScreen>
    );
  }

  return (
    <HackScreen phone={false} label="Nhiệm vụ">
      <HudBar me={me} getRemainingMs={getRemainingMs} phone={false} />
      <QuestionProgress total={payload.total} current={payload.index} marks={marks} phone={false} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", gap: "20px", padding: "14px 24px 24px" }}>
        <Panel sx={{ flex: 1, minWidth: 0, padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", fontSize: hk.fs[13], fontWeight: hk.font.weightBold }}>
            <Chip color={c.green} solid>{missionLabel}</Chip>
            {copy.chip ? <Chip color={c.cyan}>{copy.chip}</Chip> : null}
            <Box component="span" sx={{ color: c.dim }}>{copy.hint}</Box>
            <Box sx={{ flex: 1 }} />
            <Box component="span" sx={{ color: progress ? c.yellow : c.cyan }}>{progress ?? `thưởng: +${reward} sao và 1 gói dữ liệu`}</Box>
          </Box>
          <Box component="h2" sx={{ margin: 0, fontSize: titleSize, lineHeight: 1.4, fontWeight: hk.font.weightBold, color: c.white }}>{question.title}</Box>
          {question.instructions ? <Box sx={{ fontSize: hk.fs[14], color: c.dim }}>{question.instructions}</Box> : null}
          {question.contentImage && question.kind !== "hotspot" ? <QuestionContentImage question={question} /> : null}
          {body}
          <Box sx={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
            {echoLine}
            {runButton}
          </Box>
        </Panel>
        <Box sx={{ width: "320px", flex: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
          {leaderboard ? <LeaderboardPanel data={leaderboard} me={me} /> : null}
          <FeedPanel items={feed} hint={hintLine} />
        </Box>
      </Box>
    </HackScreen>
  );
}
