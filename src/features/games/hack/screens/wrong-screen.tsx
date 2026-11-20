import Box from "@mui/material/Box";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import type { AnswerPayload, AnswerResult, Question } from "@/domain/quiz/types";
import type { AnswerResultData, PlayerState, QuestionPayload } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { isTrueChoice } from "@/features/games/hack/question-meta";
import { HackButton, HackScreen, Panel } from "@/features/games/hack/ui/hack-ui";
import { HudBar } from "@/features/games/hack/ui/hud";

const c = hk.color;
const REQUEUE_DEFAULT = 3;

type WrongScreenProps = {
  phone: boolean;
  me: PlayerState;
  result: AnswerResultData;
  payload: QuestionPayload | null;
  /** What this student sent; unknown after a page reload. */
  answered: AnswerPayload | null;
  getRemainingMs: (nowMs: number) => number;
  locked: boolean;
  onNext: () => void;
};

function ChoiceRow({ tag, tone, label, phone }: { tag: string; tone: "wrong" | "right"; label: string; phone: boolean }) {
  const wrong = tone === "wrong";
  return (
    <Box
      sx={{
        border: `2px solid ${wrong ? c.red : c.green}`,
        bgcolor: wrong ? c.errPanel : c.selected,
        color: wrong ? c.errText : undefined,
        borderRadius: `${hk.radius.panel}px`,
        padding: phone ? "10px 12px" : "14px 16px",
        display: "flex",
        gap: phone ? "10px" : "12px",
        fontSize: phone ? hk.fs[15] : hk.fs[17],
      }}
    >
      <Box component="span" sx={{ color: wrong ? c.red : c.green, fontWeight: hk.font.weightBold, whiteSpace: "nowrap" }}>{tag}</Box>
      <Box component="span" sx={{ overflowWrap: "anywhere" }}>{label}</Box>
    </Box>
  );
}

/** Choice kinds show "[A] SAI / [B] MÃ ĐÚNG" rows; every other kind reuses the shared renderer in review mode. */
function Review({ question, result, answered, phone }: { question: Question; result: AnswerResultData; answered: AnswerPayload | null; phone: boolean }) {
  const choices = question.choices ?? [];
  if (question.kind === "single_choice" || question.kind === "true_false") {
    const correctIds = result.correctAnswer?.correctChoiceIds ?? [];
    const letter = (id: string) => String.fromCharCode(65 + choices.findIndex((choice) => choice.id === id));
    const picked = choices.find((choice) => choice.id === answered?.choiceId);
    const rows = [
      ...(picked ? [{ choice: picked, tone: "wrong" as const, tag: `[${letter(picked.id)}] SAI` }] : []),
      ...choices.filter((choice) => correctIds.includes(choice.id)).map((choice) => ({ choice, tone: "right" as const, tag: `[${letter(choice.id)}] MÃ ĐÚNG` })),
    ];
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: phone ? "10px" : "12px" }}>
        {rows.map(({ choice, tone, tag }) => {
          const label = question.kind === "true_false" ? (isTrueChoice(choice.label, choices.indexOf(choice)) ? "Đúng" : "Sai") : choice.label;
          return <ChoiceRow key={`${tone}-${choice.id}`} tag={tag} tone={tone} label={tone === "wrong" ? `${label} · bạn ${phone ? "chọn" : "đã chọn"}` : label} phone={phone} />;
        })}
      </Box>
    );
  }
  const reviewResult: AnswerResult = { questionId: question.id, correct: false, partiallyRight: false, awardedPoints: 0, maxPoints: question.points, message: "", ...result.correctAnswer };
  return (
    <QuestionRenderer
      question={question}
      value={answered ?? {}}
      onChange={() => undefined}
      submitted
      reviewMode
      result={reviewResult}
    />
  );
}

/** 05 · Sai mã: lời giải (HWrong / HPWrong). */
export function WrongScreen({ phone, me, result, payload, answered, getRemainingMs, locked, onNext }: WrongScreenProps) {
  const requeue = result.requeueAfter ?? REQUEUE_DEFAULT;
  const question = payload?.question ?? null;
  const banner = (
    <Box sx={{ position: "relative", display: "flex", alignItems: phone ? "stretch" : "center", flexDirection: phone ? "column" : "row", gap: phone ? 0 : "16px", bgcolor: c.errPanel, border: `2px solid ${c.red}`, borderRadius: `${hk.radius.panel}px`, padding: phone ? "12px 14px" : "12px 20px" }}>
      <Box sx={{ fontSize: phone ? hk.fs[26] : hk.fs[30], fontWeight: hk.font.weightBold, color: c.red }}>SAI MÃ</Box>
      <Box sx={{ flex: 1, fontSize: phone ? hk.fs[13] : hk.fs[15], lineHeight: phone ? 1.6 : undefined, color: c.errText }}>
        {phone ? "Không mất sao, không mất xu. Chỉ lỡ 1 gói dữ liệu." : "Không mất sao, không mất xu. Chỉ lỡ 1 gói dữ liệu và chuỗi về 0."}
      </Box>
      {phone || !payload ? null : <Box sx={{ fontSize: hk.fs[13], fontWeight: hk.font.weightBold, color: c.yellow }}>nhiệm vụ {payload.index}/{payload.total}</Box>}
    </Box>
  );
  const body = (
    <Panel sx={{ flex: phone ? undefined : 1, padding: phone ? "14px" : "20px 22px", display: "flex", flexDirection: "column", gap: phone ? "10px" : "12px" }}>
      <Box sx={{ fontSize: phone ? hk.fs[11] : hk.fs[12], fontWeight: hk.font.weightBold, color: c.cyan }}>GIẢI MÃ: HỌC LẠI NGAY</Box>
      {question ? <Box component="h2" sx={{ margin: 0, fontSize: phone ? hk.fs[16] : hk.fs[22], lineHeight: phone ? 1.5 : 1.4, fontWeight: hk.font.weightBold, color: c.white }}>{question.title}</Box> : null}
      {question ? <Review question={question} result={result} answered={answered} phone={phone} /> : null}
      {result.solution ? (
        <Box sx={{ borderLeft: `4px solid ${c.cyan}`, padding: phone ? "0 0 0 12px" : "4px 0 4px 16px", fontSize: phone ? hk.fs[14] : hk.fs[16], lineHeight: 1.7 }}>{result.solution}</Box>
      ) : null}
      {phone ? null : (
        <Box sx={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          <Box sx={{ flex: 1, fontSize: hk.fs[14], color: c.mint }}>Nhiệm vụ này sẽ quay lại sau {requeue} câu nữa. Làm đúng lúc đó vẫn nhận đủ sao.</Box>
          <HackButton disabled={locked} onClick={onNext}>&gt; ĐÃ HIỂU, LÀM TIẾP</HackButton>
        </Box>
      )}
    </Panel>
  );

  return (
    <HackScreen phone={phone} label="Sai mã">
      <HudBar me={me} getRemainingMs={getRemainingMs} phone={phone} streakBroken hideRank={false} />
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: phone ? "12px" : "14px", padding: phone ? "14px 14px 16px" : "20px 24px 24px" }}>
        {banner}
        {body}
        {phone ? (
          <>
            <Box sx={{ marginTop: "auto", fontSize: hk.fs[12], lineHeight: 1.6, color: c.mint }}>Nhiệm vụ này quay lại sau {requeue} câu nữa. Làm đúng vẫn nhận đủ sao.</Box>
            <HackButton disabled={locked} onClick={onNext} fullWidth>&gt; ĐÃ HIỂU, LÀM TIẾP</HackButton>
          </>
        ) : null}
      </Box>
    </HackScreen>
  );
}
