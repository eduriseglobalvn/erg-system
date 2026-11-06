import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { WeeklyClassLogPage } from "@/features/lms/weekly-class-log";
import { useWeeklyClassLogController } from "./use-weekly-class-log-controller";
import { WeeklyClassLogTable } from "./weekly-class-log-table";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 3, 9, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

test("opens on the current ISO week, navigates both ways and shows an honest empty state without the dev banner", () => {
  render(<WeeklyClassLogPage selectedSchoolName="Trường Tiểu học ERG" teacherName="Lê Thị Thùy" />);

  expect(screen.getByRole("heading", { name: "Sổ đầu bài" })).toBeInTheDocument();
  expect(screen.getByText("Tuần 23 · 01/06 - 07/06")).toBeInTheDocument();
  expect(screen.queryByText(/Chưa có hợp đồng máy chủ/)).not.toBeInTheDocument();
  expect(screen.getByText(/chưa thể lưu/)).toBeInTheDocument();

  const next = screen.getByRole("button", { name: "Sau" });
  const previous = screen.getByRole("button", { name: "Trước" });
  expect(next).toBeEnabled();
  fireEvent.click(next);
  expect(screen.getByText("Tuần 24 · 08/06 - 14/06")).toBeInTheDocument();
  fireEvent.click(previous);
  fireEvent.click(previous);
  expect(screen.getByText("Tuần 22 · 25/05 - 31/05")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Tuần này" }));
  expect(screen.getByText("Tuần 23 · 01/06 - 07/06")).toBeInTheDocument();
});

function TableHarness() {
  const controller = useWeeklyClassLogController("Lê Thị Thùy");
  return <WeeklyClassLogTable controller={controller} />;
}

test("labels every input as Thứ / Tiết / Cột and keeps edits", () => {
  const { container } = render(<TableHarness />);

  expect(screen.getByText("01/06/2026")).toBeInTheDocument();
  const unlabeled = Array.from(container.querySelectorAll("input:not([aria-hidden]), textarea")).filter((node) => !node.getAttribute("aria-label"));
  expect(unlabeled).toHaveLength(0);
  expect(container.querySelectorAll("input[aria-label]:not([aria-hidden]), textarea[aria-label]")).toHaveLength(5 * 10 * 5);
  expect(screen.getByLabelText("Thứ 2 · Tiết 1 · Lớp")).toBeInTheDocument();
  expect(screen.getByLabelText("Thứ 6 · Tiết 5 chiều · Nhận xét")).toBeInTheDocument();
  expect(screen.getByLabelText("Thứ 3 · Tiết 2 · Kỷ luật")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Thứ 2 · Tiết 1 · Lớp"), { target: { value: "6A1" } });
  expect(screen.getByLabelText("Thứ 2 · Tiết 1 · Lớp")).toHaveValue("6A1");
});
