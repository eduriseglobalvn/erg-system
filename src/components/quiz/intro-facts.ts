export type IntroFact = { id: "questions" | "duration" | "attempts" | "passScore" | "due"; value: string; label: string };

type IntroFactSource = {
  questionCount: number;
  timeLimitSeconds?: number | null;
  attemptsUsed?: number | null;
  attemptsAllowed?: number | null;
  passScore?: number | null;
  dueAt?: string | null;
};

function formatRemaining(dueAt: string, now: Date): string | null {
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;
  const minutes = Math.floor((due - now.getTime()) / 60_000);
  if (minutes <= 0) return "Đã quá hạn";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  return hours > 0 ? `Còn ${hours} giờ ${rest} phút` : `Còn ${rest} phút`;
}

/** Only facts that exist: a missing source field drops its tile, nothing is filled in. */
export function buildIntroFacts(s: IntroFactSource, now: Date): IntroFact[] {
  const facts: IntroFact[] = [{ id: "questions", value: String(s.questionCount), label: "câu hỏi" }];
  if (s.timeLimitSeconds) facts.push({ id: "duration", value: `${Math.ceil(s.timeLimitSeconds / 60)} phút`, label: "làm bài" });
  if (s.attemptsAllowed) {
    // The attempt about to start: used + 1, never past the allowance.
    facts.push({ id: "attempts", value: `${Math.min((s.attemptsUsed ?? 0) + 1, s.attemptsAllowed)}/${s.attemptsAllowed}`, label: "lần làm" });
  }
  if (typeof s.passScore === "number") facts.push({ id: "passScore", value: s.passScore.toFixed(1).replace(".", ","), label: "điểm đạt" });
  const due = s.dueAt ? formatRemaining(s.dueAt, now) : null;
  if (due) facts.push({ id: "due", value: due, label: "hạn nộp" });
  return facts;
}

export function introRules(s: { autosave: boolean; timeLimitSeconds?: number | null; showAnswersAfterSubmit?: boolean | null }): string[] {
  const rules: string[] = [];
  if (s.timeLimitSeconds) rules.push("Đồng hồ chạy từ lúc bấm. Hết giờ bài tự nộp.");
  if (s.autosave) rules.push("Tự lưu sau mỗi câu");
  if (s.showAnswersAfterSubmit === true) rules.push("Xem đáp án sau khi nộp");
  return rules;
}
