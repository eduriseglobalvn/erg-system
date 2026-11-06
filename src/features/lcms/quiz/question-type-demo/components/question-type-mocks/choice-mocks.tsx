import { useState } from "react";
import { cn } from "@/utils/cn";

export function SingleChoiceMock() {
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

export function MultipleResponseMock() {
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

export function TrueFalseMock() {
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
