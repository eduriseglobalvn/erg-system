import { useState } from "react";
import { cn } from "@/utils/cn";

export function HotspotMock() {
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

export function LikertMock() {
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
