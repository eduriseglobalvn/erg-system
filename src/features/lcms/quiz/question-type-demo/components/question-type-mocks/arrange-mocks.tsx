import { useState } from "react";
import { cn } from "@/utils/cn";

export function SequenceMock() {
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

export function MatchingMock() {
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

export function DragWordsMock() {
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

export function DragDropMock() {
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
