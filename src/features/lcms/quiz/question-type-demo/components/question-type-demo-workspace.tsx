import { useState } from "react";

import { getLmsPortalUrl } from "@/config/portal-urls";
import {
  questionTypeDemos,
  readinessCopy,
  type QuestionTypeDemo,
} from "@/features/lcms/quiz/question-type-demo/data/question-type-demos";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { QuestionPreview } from "@/features/lcms/quiz/question-type-demo/components/question-type-mocks/question-preview";

const accentLine = "var(--erg-blue)";

export function QuestionTypeDemoWorkspace() {
  const [activeKind, setActiveKind] = useState<QuestionType>(questionTypeDemos[0]!.kind);
  const activeDemo = questionTypeDemos.find((demo) => demo.kind === activeKind) ?? questionTypeDemos[0]!;
  const playerReadyCount = questionTypeDemos.filter((demo) => demo.readiness === "player-ready").length;

  return (
    <main className="min-h-svh bg-[#f7f9fd] text-slate-950">
      <div className="h-1.5 w-full" style={{ background: accentLine }} />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-2.5 py-1 text-xs font-semibold text-[var(--erg-blue)]">
                ERG quiz type demo
              </div>
              <h1 className="mt-3 max-w-3xl text-lg font-semibold text-[#242424] sm:text-xl">
                Mock đủ 14 loại câu hỏi theo bộ tạo quiz
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#616161]">
                Trang này dùng để demo nhanh UI/UX từng dạng câu hỏi trong ảnh: từ trắc nghiệm, nối cặp, kéo thả,
                hotspot đến tự luận. Màu sắc giữ theo tinh thần ERG: sạch, xanh chủ đạo, đỏ nhấn.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="#question-preview"
                  className="inline-flex h-9 items-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--erg-blue-hover)]"
                >
                  Xem demo đang chọn
                </a>
                <a
                  href={getLmsPortalUrl()}
                  className="inline-flex h-9 items-center rounded-md border border-[#d7e0ec] bg-white px-4 text-sm font-semibold text-[var(--erg-blue)] transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]"
                >
                  Về dashboard
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard label="Tổng loại câu hỏi" value={questionTypeDemos.length.toString()} />
              <MetricCard label="Đã có player/engine" value={playerReadyCount.toString()} />
              <MetricCard label="Mock để nối BE sau" value={(questionTypeDemos.length - playerReadyCount).toString()} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-lg border border-[#d9e0ea] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-1 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#242424]">Danh sách dạng câu hỏi</h2>
                <p className="mt-1 text-sm text-[#616161]">Bấm từng card để xem mock tương tác.</p>
              </div>
              <span className="rounded-md bg-[#f6f8fb] px-2.5 py-1 text-xs font-semibold text-[#616161]">
                14 dạng
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {questionTypeDemos.map((demo, index) => (
                <QuestionTypeCard
                  key={demo.kind}
                  demo={demo}
                  index={index}
                  active={demo.kind === activeKind}
                  onSelect={() => setActiveKind(demo.kind)}
                />
              ))}
            </div>
          </section>

          <section
            id="question-preview"
            className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white shadow-sm"
          >
            <div className="border-b border-[#edf1f5] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[var(--erg-blue-light)] px-2.5 py-1 text-xs font-semibold text-[var(--erg-blue)]">
                      {activeDemo.shortLabel}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-semibold",
                        readinessCopy[activeDemo.readiness].className,
                      )}
                    >
                      {readinessCopy[activeDemo.readiness].label}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-[#242424]">
                    {activeDemo.label}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#616161]">
                    {activeDemo.description}
                  </p>
                </div>
                <QuestionTypeMiniature kind={activeDemo.kind} active />
              </div>
            </div>

            <div className="bg-[#f8fbff] p-4 sm:p-6">
              <div className="rounded-lg border border-[#d9e7ff] bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 rounded-md bg-[var(--erg-blue)] px-4 py-3 text-base font-semibold leading-snug text-white">
                  {getPrompt(activeDemo.kind)}
                </div>
                <QuestionPreview kind={activeDemo.kind} />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#edf1f5] bg-[#f6f8fb] p-4">
      <div className="text-base font-semibold text-[#242424]">{value}</div>
      <div className="mt-1 text-sm font-medium text-[#616161]">{label}</div>
    </div>
  );
}

function QuestionTypeCard({
  demo,
  index,
  active,
  onSelect,
}: {
  demo: QuestionTypeDemo;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]",
        active
          ? "border-[#b8d6fa] bg-white shadow-sm"
          : "border-[#d9e0ea] bg-white hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]",
      )}
      onClick={onSelect}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-[var(--erg-blue)]">
        {index + 1}
      </span>
      <QuestionTypeMiniature kind={demo.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#242424]">{demo.label}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-[#616161]">{demo.description}</span>
      </span>
    </button>
  );
}

function QuestionTypeMiniature({ kind, active = false }: { kind: QuestionType; active?: boolean }) {
  const lineClass = active ? "bg-[#b8d6fa]" : "bg-slate-300";
  const controlClass = active ? "border-[var(--erg-blue)] bg-[var(--erg-blue-light)]" : "border-slate-300 bg-white";

  return (
    <span className="grid h-14 w-16 shrink-0 place-items-center rounded-md border border-[#d9e0ea] bg-white shadow-sm">
      <span className="flex h-10 w-12 flex-col gap-1 rounded-sm border border-slate-300 bg-slate-50 p-1.5">
        <span className="h-1 rounded-sm bg-[#b8d6fa]" />
        {kind === "matching" || kind === "sequence" ? (
          <>
            <span className="flex items-center gap-1">
              <span className="text-[8px] font-semibold text-[var(--erg-blue)]">1</span>
              <span className={cn("h-1 flex-1 rounded-sm", lineClass)} />
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[8px] font-semibold text-[var(--erg-blue)]">2</span>
              <span className={cn("h-1 flex-1 rounded-sm", lineClass)} />
            </span>
          </>
        ) : kind === "hotspot" ? (
          <span className="relative mt-0.5 h-6 rounded-sm bg-[var(--erg-blue-light)]">
            <span className="absolute left-5 top-2 h-3 w-3 rounded-md border border-[var(--erg-blue)]" />
          </span>
        ) : kind === "drag-and-drop" || kind === "drag-the-words" ? (
          <span className="mt-1 grid grid-cols-3 gap-0.5">
            <span className={cn("h-2 rounded-sm border", controlClass)} />
            <span className={cn("h-2 rounded-sm border", controlClass)} />
            <span className={cn("h-2 rounded-sm border border-dashed", controlClass)} />
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-md border", controlClass)} />
              <span className={cn("h-1 flex-1 rounded-sm", lineClass)} />
            </span>
            <span className="flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-md border", controlClass)} />
              <span className={cn("h-1 flex-1 rounded-sm", lineClass)} />
            </span>
          </>
        )}
      </span>
    </span>
  );
}

function getPrompt(kind: QuestionType) {
  const prompts: Record<QuestionType, string> = {
    "multiple-choice": "Bạn không thể gửi tập tin nào sau đây qua một nhà cung cấp email tiêu chuẩn?",
    "multiple-response": "Chọn các hành động giúp bài nộp trực tuyến rõ ràng và dễ chấm hơn.",
    "true-false": "Bật xác thực hai lớp giúp tài khoản học tập an toàn hơn.",
    "short-answer": "Tên định dạng file thường dùng để nộp bài đọc được trên nhiều máy là gì?",
    numeric: "Một tài liệu có giới hạn tối đa bao nhiêu trang?",
    sequence: "Sắp xếp quy trình học tập online theo thứ tự hợp lý.",
    matching: "Ghép các bước trong chu trình quản lý dự án với mô tả của nó.",
    "fill-in-the-blanks": "Điền từ còn thiếu vào câu sau.",
    "select-from-lists": "Với mỗi tình huống, chọn Có nếu nên làm hoặc Không nếu không nên làm.",
    "drag-the-words": "Bấm từ trong ngân hàng để đưa vào đúng chỗ trống.",
    hotspot: "Bấm vào vùng thông tin phiên bản trong màn hình minh họa.",
    "drag-and-drop": "Phân loại các món vào nhóm phù hợp.",
    "likert-scale": "Đánh giá mức độ đồng ý của em sau bài học.",
    essay: "Viết ngắn cách em sẽ giải thích chủ đề này cho bạn cùng lớp.",
  };

  return prompts[kind];
}
