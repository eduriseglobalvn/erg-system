import { useState } from "react";
import { AppSelect } from "@/components/ui/app-select";

export function ShortAnswerMock() {
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

export function NumericMock() {
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

export function FillBlankMock() {
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

export function SelectFromListsMock() {
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

export function EssayMock() {
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
