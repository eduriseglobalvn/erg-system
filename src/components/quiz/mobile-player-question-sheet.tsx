import { useState } from "react";
import { ChevronLeft, List, X } from "lucide-react";
import Drawer from "@mui/material/Drawer";

import { QuestionNavigator } from "@/components/quiz/question-navigator";
import type { Question } from "@/domain/quiz/types";

export function MobileQuestionSheet({
  answeredQuestionIds,
  bookmarkCount,
  bookmarkedQuestionIds,
  currentIndex,
  questions,
  onJumpToQuestion,
}: {
  answeredQuestionIds: string[];
  bookmarkCount: number;
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  questions: Question[];
  onJumpToQuestion: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Mở mục lục câu hỏi"
        className="grid h-11 w-11 place-items-center text-[var(--erg-blue)] transition"
        onClick={() => setOpen(true)}
      >
        <List className="h-4 w-4" />
      </button>
      <Drawer
        anchor="top"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { height: "100svh", maxHeight: "100svh", width: "100vw", maxWidth: "none", backgroundColor: "#f7f8fb" } } }}
      >
        <div className="relative border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            aria-label="Đóng mục lục câu hỏi"
            className="absolute left-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            onClick={() => setOpen(false)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center text-base font-semibold text-slate-900">Mục lục</div>
          <div className="text-center text-xs font-semibold text-slate-500">{bookmarkCount} câu đã đánh dấu</div>
          <button
            type="button"
            aria-label="Đóng mục lục câu hỏi"
            className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[var(--erg-blue)]"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <QuestionNavigator
          answeredQuestionIds={answeredQuestionIds}
          className="min-h-[calc(100svh-68px)] rounded-none border-0 shadow-none"
          currentIndex={currentIndex}
          flaggedQuestionIds={bookmarkedQuestionIds}
          onJumpToQuestion={(index) => {
            onJumpToQuestion(index);
            setOpen(false);
          }}
          questions={questions}
          started
        />
      </Drawer>
    </>
  );
}

export function IntroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--erg-blue)]">{value}</div>
    </div>
  );
}