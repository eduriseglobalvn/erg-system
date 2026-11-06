// Dev-only page for src/test/e2e/quiz-player-grid.spec.ts: renders the real question-list UI with a
// 90-question quiz so the layout can be checked in a browser without a backend. Never imported by app code.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/globals.css";
import "@/index.css";

import { MobileQuestionSheet } from "@/components/quiz/mobile-player-question-sheet";
import { PlayerDesktopLayout } from "@/components/quiz/player-shell-runtime/player-desktop-layout";
import { PlayerQuestionAside } from "@/components/quiz/player-shell-runtime/player-question-aside";
import { buildTakingCells } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import ErgMuiProvider from "@/themes/ErgMuiProvider";

const params = new URLSearchParams(window.location.search);
const total = Number(params.get("n") ?? 90);
const current = Number(params.get("current") ?? 60);
const view = params.get("view") ?? "phone";

const answered = new Set(Array.from({ length: Math.min(current, total) }, (_, i) => i).filter((i) => i % 3 !== 0));
const cells = buildTakingCells(total, answered, new Set([5, 12, 61]), current);
const reviewCells: QuestionCell[] = cells.map((cell) => ({
  ...cell,
  state: cell.index % 5 === 0 ? "wrong" : cell.index % 7 === 0 ? "skipped" : "correct",
}));

const noop = () => undefined;
const question = { id: "q1", kind: "single_choice", title: "Câu hỏi mẫu", points: 1 };
const desktopProps = {
  allQuestionsAnswered: false, answeredCount: answered.size, attemptCompleted: false, canvasStyle: {}, cells,
  countdownProps: { active: false, deadlineAt: null, onExpiredChange: noop, session: null }, currentAnswerComplete: true,
  currentIndex: current, footerMessage: "Dùng Câu trước / Câu tiếp để rà soát bài trước khi nộp.", isCurrentQuestionBookmarked: false,
  isFirstQuestion: false, isLastQuestion: false, isTestingMode: true, isTrainingMode: false, lastResult: null, modeBadgeStyle: {},
  playerCardStyle: {}, questionBody: <p>Nội dung câu hỏi</p>, questionBodyRef: { current: null }, questions: cells, readyAttempt: {},
  readyQuestion: question, resultDisplay: { reviewButtonLabel: "Xem lại", passMessage: "Đạt", failMessage: "Chưa đạt" },
  reviewingSubmittedAttempt: false, saveIndicator: <span>Đã lưu 10:42</span>, submitFailed: false, submitted: false, submitting: false,
  onJumpToQuestion: noop, handleRequestSubmit: noop, handleReviewQuiz: noop, handleToggleBookmark: async () => undefined,
  setCurrentIndex: noop, submitCurrentTrainingQuestion: async () => undefined,
};

function Harness() {
  if (view === "player") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <div style={{ padding: 12 }}><PlayerDesktopLayout {...(desktopProps as any)} /></div>;
  }
  if (view === "web") {
    return (
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "340px 340px", height: 640, padding: 12 }}>
        <PlayerQuestionAside cells={cells} onSelect={() => undefined}>
          <button type="button">Nộp bài</button>
        </PlayerQuestionAside>
        <aside data-testid="review-column" style={{ border: "1px solid #ccc", padding: 16 }}>
          <QuestionListPanel cells={reviewCells} mode="review" onSelect={() => undefined} surface="web" />
        </aside>
      </div>
    );
  }
  if (view === "phone-review") {
    return (
      <div data-testid="review-column" style={{ padding: 16 }}>
        <QuestionListPanel cells={reviewCells} mode="review" onSelect={() => undefined} surface="phone" />
      </div>
    );
  }
  return (
    <div style={{ height: 3000 }}>
      <p>Trang nền cao hơn màn hình, để kiểm tra trang không cuộn khi mở sheet.</p>
      <MobileQuestionSheet cells={cells} onJumpToQuestion={() => undefined} onRequestSubmit={() => undefined} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErgMuiProvider>
      <Harness />
    </ErgMuiProvider>
  </StrictMode>,
);
