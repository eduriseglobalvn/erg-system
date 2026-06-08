import { useState } from "react";

import { getLmsPortalUrl } from "@/config/portal-urls";
import {
  questionTypeDemos,
  readinessCopy,
  type QuestionTypeDemo,
} from "@/features/lcms/quiz/question-type-demo/data/question-type-demos";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

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

function QuestionPreview({ kind }: { kind: QuestionType }) {
  switch (kind) {
    case "multiple-choice":
      return <SingleChoiceMock />;
    case "multiple-response":
      return <MultipleResponseMock />;
    case "true-false":
      return <TrueFalseMock />;
    case "short-answer":
      return <ShortAnswerMock />;
    case "numeric":
      return <NumericMock />;
    case "sequence":
      return <SequenceMock />;
    case "matching":
      return <MatchingMock />;
    case "fill-in-the-blanks":
      return <FillBlankMock />;
    case "select-from-lists":
      return <SelectFromListsMock />;
    case "drag-the-words":
      return <DragWordsMock />;
    case "hotspot":
      return <HotspotMock />;
    case "drag-and-drop":
      return <DragDropMock />;
    case "likert-scale":
      return <LikertMock />;
    case "essay":
      return <EssayMock />;
    default:
      return null;
  }
}

function SingleChoiceMock() {
  const [selected, setSelected] = useState("gmail");
  const choices = [
    ["gmail", "Gmail là dịch vụ email phổ biến"],
    ["bluetooth", "Bluetooth dùng để gửi email chuẩn"],
    ["zip", "Tệp ZIP luôn là email"],
    ["browser", "Trình duyệt không liên quan email"],
  ];

  return (
    <div className="grid gap-3">
      {choices.map(([id, label]) => (
        <ChoiceButton key={id} active={selected === id} shape="radio" onClick={() => setSelected(id)}>
          {label}
        </ChoiceButton>
      ))}
    </div>
  );
}

function MultipleResponseMock() {
  const [selected, setSelected] = useState(["compress", "format"]);
  const choices = [
    ["compress", "Nén ảnh trước khi nộp"],
    ["format", "Dùng đúng định dạng được yêu cầu"],
    ["rename", "Đặt tên file rõ ràng"],
    ["random", "Tải file bất kỳ lên hệ thống"],
  ];

  return (
    <div className="grid gap-3">
      {choices.map(([id, label]) => (
        <ChoiceButton
          key={id}
          active={selected.includes(id)}
          shape="checkbox"
          onClick={() =>
            setSelected((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
        >
          {label}
        </ChoiceButton>
      ))}
    </div>
  );
}

function TrueFalseMock() {
  const [selected, setSelected] = useState("true");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        ["true", "Đúng"],
        ["false", "Sai"],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={cn(
            "min-h-24 rounded-lg border px-5 text-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]",
            selected === id
              ? "border-[var(--erg-blue)] bg-[rgb(0_0_139_/_0.08)] text-[var(--erg-blue)]"
              : "border-slate-200 bg-white text-slate-600 hover:border-[#b8d6fa]",
          )}
          onClick={() => setSelected(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ShortAnswerMock() {
  const [value, setValue] = useState("Tệp PDF");

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold  text-slate-500">Câu trả lời</label>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-14 w-full rounded-lg border border-slate-200 bg-white px-5 text-xl font-medium outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
        placeholder="Nhập câu trả lời ngắn"
      />
      <p className="rounded-lg bg-[var(--erg-blue-light)] px-4 py-3 text-sm font-semibold text-[var(--erg-blue)]">
        Mock keyword: hệ thống có thể chấm theo danh sách từ khóa hoặc gửi giáo viên duyệt.
      </p>
    </div>
  );
}

function NumericMock() {
  const [value, setValue] = useState("400");

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
      <input
        type="number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-14 rounded-lg border border-slate-200 bg-white px-5 text-xl font-semibold outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      />
      <div className="grid h-14 place-items-center rounded-lg bg-slate-100 text-sm font-semibold  text-slate-600">
        trang
      </div>
      <div className="sm:col-span-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        Ví dụ rule: đúng nếu giá trị nằm trong khoảng 390-410.
      </div>
    </div>
  );
}

function SequenceMock() {
  const [items, setItems] = useState([
    "Xác định mục tiêu",
    "Chọn hoạt động",
    "Giao bài tập",
    "Nhận phản hồi",
  ]);

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--erg-blue)] text-lg font-semibold text-white">
            {index + 1}
          </span>
          <span className="flex-1 text-lg font-medium text-slate-800">{item}</span>
          <button type="button" className="h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold" onClick={() => move(index, -1)}>
            Lên
          </button>
          <button type="button" className="h-9 rounded-lg bg-slate-100 px-3 text-sm font-semibold" onClick={() => move(index, 1)}>
            Xuống
          </button>
        </div>
      ))}
    </div>
  );
}

function MatchingMock() {
  const pairs = [
    { id: "monitoring", left: "Giám sát (Monitoring)", right: "Theo dõi tiến độ và rủi ro dự án" },
    { id: "initiation", left: "Khởi tạo (Initiation)", right: "Quyết định có theo đuổi dự án hay không" },
    { id: "execution", left: "Thực hiện (Execution)", right: "Tạo ra sản phẩm dự án" },
    { id: "close", left: "Đóng (Close)", right: "Bàn giao và đánh giá dự án" },
  ];
  const [order, setOrder] = useState(["execution", "initiation", "monitoring", "close"]);

  function rotate() {
    setOrder((current) => [...current.slice(1), current[0]!]);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {pairs.map((pair, rowIndex) => {
          const assignedId = order[rowIndex]!;
          const assigned = pairs.find((item) => item.id === assignedId)!;
          const originalNumber = pairs.findIndex((item) => item.id === assignedId) + 1;
          const isCorrect = assignedId === pair.id;

          return (
            <div key={pair.id} className="grid items-stretch gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
              <div
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-l-2xl border bg-white px-4 text-lg font-medium",
                  isCorrect ? "border-emerald-400 text-emerald-700" : "border-red-300 text-red-600",
                )}
              >
                <span className="text-xl font-semibold">{rowIndex + 1}.</span>
                {pair.left}
              </div>
              <div
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-r-2xl border border-l-0 bg-white px-4 text-lg font-medium",
                  isCorrect ? "border-emerald-400 text-emerald-700" : "border-red-300 text-red-600",
                )}
              >
                <span className="text-xl font-semibold">{originalNumber}.</span>
                {assigned.right}
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="rounded-md bg-[var(--erg-blue)] px-5 py-3 text-sm font-semibold text-white" onClick={rotate}>
        Đổi thử thứ tự đáp án bên phải
      </button>
    </div>
  );
}

function FillBlankMock() {
  const [first, setFirst] = useState("mật khẩu");
  const [second, setSecond] = useState("hai lớp");

  return (
    <div className="rounded-lg bg-slate-50 p-5 text-xl font-medium leading-[2.2] text-slate-800">
      Để bảo vệ tài khoản học tập, em nên dùng{" "}
      <BlankInput value={first} onChange={setFirst} placeholder="..." /> mạnh và bật xác thực{" "}
      <BlankInput value={second} onChange={setSecond} placeholder="..." />.
    </div>
  );
}

function SelectFromListsMock() {
  const [answers, setAnswers] = useState({ first: "Có", second: "Không", third: "Có" });

  return (
    <div className="grid gap-3 text-lg font-medium text-slate-800">
      {[
        ["first", "Báo cáo tài khoản giả mạo", ["Có", "Không"]],
        ["second", "Chia sẻ mật khẩu với bạn thân", ["Có", "Không"]],
        ["third", "Kiểm tra nguồn trước khi tải file", ["Có", "Không"]],
      ].map(([id, label, options]) => (
        <label key={id as string} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-4">
          <span className="flex-1">{label as string}</span>
          <AppSelect
            value={answers[id as keyof typeof answers]}
            onChange={(event) => setAnswers((current) => ({ ...current, [id as string]: event.target.value }))}
            className="h-11 rounded-md border border-[#b8d6fa] bg-white px-4 font-semibold text-[var(--erg-blue)] outline-none"
          >
            {(options as string[]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </AppSelect>
        </label>
      ))}
    </div>
  );
}

function DragWordsMock() {
  const words = ["an toàn", "nguồn", "cập nhật"];
  const [slots, setSlots] = useState(["an toàn", "", "cập nhật"]);

  function placeWord(word: string) {
    setSlots((current) => {
      const emptyIndex = current.findIndex((item) => !item);
      if (emptyIndex === -1) return current;
      const next = [...current];
      next[emptyIndex] = word;
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-slate-50 p-5 text-xl font-medium leading-[2.4] text-slate-800">
        Khi tải tài liệu, hãy kiểm tra{" "}
        <WordSlot value={slots[0]} /> của file, chọn trang web đáng tin cậy và luôn{" "}
        <WordSlot value={slots[1]} /> phần mềm học tập.
      </div>
      <div className="flex flex-wrap gap-3">
        {words.map((word) => (
          <button
            key={word}
            type="button"
            className="cursor-grab rounded-md border border-[#b8d6fa] bg-white px-4 py-2 text-sm font-semibold text-[var(--erg-blue)] shadow-sm transition "
            onClick={() => placeWord(word)}
          >
            {word}
          </button>
        ))}
        <button type="button" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold" onClick={() => setSlots(["", "", ""])}>
          Làm lại
        </button>
      </div>
    </div>
  );
}

function HotspotMock() {
  const [point, setPoint] = useState({ x: 62, y: 42 });

  return (
    <div className="space-y-4">
      <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-[#0b7f9d] bg-[#f7f8fa]">
        <div className="absolute left-[12%] top-[18%] h-32 w-44 rounded-lg border border-[#b8d6fa] bg-white p-4 shadow-sm">
          <div className="h-3 w-24 rounded-full bg-slate-200" />
          <div className="mt-4 h-20 rounded-md bg-slate-100" />
        </div>
        <button
          type="button"
          className="absolute left-[58%] top-[34%] h-28 w-40 rounded-lg border border-dashed border-[var(--erg-blue)] bg-white/80 p-4 text-left text-sm font-semibold text-[var(--erg-blue)]"
          onClick={() => setPoint({ x: 66, y: 48 })}
        >
          Vùng đúng: thông tin phiên bản
        </button>
        <button
          type="button"
          aria-label="Điểm đã chọn"
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-md border-4 border-white bg-[var(--erg-red)] shadow-sm"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          onClick={() => setPoint({ x: 24, y: 55 })}
        />
      </div>
      <p className="text-sm font-semibold text-slate-500">Bấm vùng nét đứt để đặt điểm nóng đúng.</p>
    </div>
  );
}

function DragDropMock() {
  const items = ["Broccoli", "Cookie", "Apple", "Chips"];
  const [healthy, setHealthy] = useState(["Broccoli", "Apple"]);
  const [snack, setSnack] = useState(["Cookie", "Chips"]);

  function moveTo(item: string, target: "healthy" | "snack") {
    setHealthy((current) => current.filter((entry) => entry !== item));
    setSnack((current) => current.filter((entry) => entry !== item));
    if (target === "healthy") {
      setHealthy((current) => [...current, item]);
    } else {
      setSnack((current) => [...current, item]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="font-semibold text-slate-800">{item}</div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" onClick={() => moveTo(item, "healthy")}>
                Healthy
              </button>
              <button type="button" className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700" onClick={() => moveTo(item, "snack")}>
                Snack
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DropZone title="Healthy food" items={healthy} tone="green" />
        <DropZone title="Snack / dessert" items={snack} tone="red" />
      </div>
    </div>
  );
}

function LikertMock() {
  const rows = ["Em hiểu bài hôm nay", "Em tự tin làm bài tập", "Em muốn luyện thêm"];
  const columns = ["1", "2", "3", "4", "5"];
  const [answers, setAnswers] = useState<Record<string, string>>({
    "Em hiểu bài hôm nay": "4",
    "Em tự tin làm bài tập": "3",
    "Em muốn luyện thêm": "5",
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
          <tr>
            <th className="p-4">Tiêu chí</th>
            {columns.map((column) => (
              <th key={column} className="p-4 text-center">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="border-t border-slate-100">
              <td className="p-4 font-medium text-slate-800">{row}</td>
              {columns.map((column) => (
                <td key={column} className="p-4 text-center">
                  <button
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-md border transition",
                      answers[row] === column ? "border-[var(--erg-blue)] bg-[var(--erg-blue)]" : "border-slate-300 bg-white",
                    )}
                    aria-label={`${row}: ${column}`}
                    onClick={() => setAnswers((current) => ({ ...current, [row]: column }))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EssayMock() {
  const [value, setValue] = useState(
    "Em sẽ bắt đầu bằng ví dụ gần gũi, sau đó cho bạn trong lớp phân nhóm thực phẩm và giải thích lý do.",
  );

  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-44 w-full resize-y rounded-lg border border-slate-200 bg-white p-5 text-lg font-medium leading-7 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      />
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="text-sm font-semibold  text-slate-500">Rubric mock</div>
        <div className="mt-2 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-3">
          <span>Ví dụ rõ ràng: 4đ</span>
          <span>Giải thích đúng: 4đ</span>
          <span>Trình bày sạch: 2đ</span>
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  shape,
  children,
  onClick,
}: {
  active: boolean;
  shape: "radio" | "checkbox";
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-lg border px-4 text-left text-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]",
        active ? "border-[var(--erg-blue)] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "border-slate-200 bg-white text-slate-700 hover:border-[#b8d6fa]",
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center border bg-white",
          shape === "radio" ? "rounded-full" : "rounded-lg",
          active ? "border-[var(--erg-blue)]" : "border-slate-300",
        )}
      >
        {active ? <span className={cn("h-3.5 w-3.5 bg-[var(--erg-blue)]", shape === "radio" ? "rounded-full" : "rounded")} /> : null}
      </span>
      {children}
    </button>
  );
}

function BlankInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="mx-1 inline h-11 min-w-32 rounded-md border border-[#b8d6fa] bg-white px-3 text-center font-semibold text-[var(--erg-blue)] outline-none focus:border-[var(--erg-blue)]"
    />
  );
}

function WordSlot({ value }: { value: string }) {
  return (
    <span className="inline-flex min-h-11 min-w-32 items-center justify-center rounded-md border border-dashed border-[#b8d6fa] bg-white px-3 text-center font-semibold text-[var(--erg-blue)]">
      {value || "......"}
    </span>
  );
}

function DropZone({ title, items, tone }: { title: string; items: string[]; tone: "green" | "red" }) {
  return (
    <div className={cn("min-h-40 rounded-lg border border-dashed p-4", tone === "green" ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50")}>
      <div className={cn("text-sm font-semibold ", tone === "green" ? "text-emerald-700" : "text-red-700")}>
        {title}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
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
