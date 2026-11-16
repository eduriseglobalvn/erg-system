import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), preview: vi.fn(), reuse: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-reuse-api", () => ({
  previewTeachingScheduleReuse: mocks.preview,
  reuseTeachingScheduleWeek: mocks.reuse,
}));

import { ReuseDialog, excludedSentence } from "./reuse-dialog";
import { reuseWeekDetail } from "./reuse-preview-table";

const week = (weekStart: string, toCreate: number, extra: object = {}) => ({
  conflictDetails: [], conflicts: 0, holidays: [], skipped: 0, toCreate, weekEnd: weekStart, weekStart, ...extra,
});
const PREVIEW = {
  excludedConflicts: [{ periodNo: 6, weekday: 3 }],
  perTeacher: [{ periods: 7, teacherId: "t1", teacherName: "T.Tuấn" }, { periods: 11, teacherId: "t2", teacherName: "Q.Vương" }],
  sourcePeriods: 18,
  totalToCreate: 44,
  weeks: [
    week("2026-11-16", 11, { holidays: [{ date: "2026-11-20", name: "Nhà giáo VN" }], skipped: 6 }),
    week("2026-11-23", 16, { conflicts: 1 }),
    week("2026-11-30", 17),
  ],
};

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReuseDialog onClose={vi.fn()} onSchoolChange={vi.fn()} open schoolId="s1" schools={[{ id: "s1", name: "THCS Trương Công Định" }]} weekStart="2026-11-09" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocks.preview.mockReset().mockResolvedValue(PREVIEW);
  mocks.reuse.mockReset().mockResolvedValue({ batch: { affectedEventCount: 44, id: "b9", label: "Đợt 2" } });
  mocks.navigate.mockReset();
});

it("shows the create button with totalToCreate and the board summary", async () => {
  renderDialog();
  expect(await screen.findByRole("button", { name: "Tạo 44 tiết nháp" })).toBeEnabled();
  expect(screen.getByText(/THCS Trương Công Định · 18 tiết · T\.Tuấn 7, Q\.Vương 11\./)).toHaveTextContent("Tiết đang trùng (Thứ 4 tiết 6) sẽ không được copy.");
  expect(screen.getByText("Bỏ qua ngày nghỉ (20/11 · Nhà giáo VN)")).toBeInTheDocument();
  expect(screen.getAllByText("Như tuần gốc").length).toBeGreaterThan(0);
});

it("debounces preview calls and passes an abort signal", async () => {
  renderDialog();
  await screen.findByRole("button", { name: "Tạo 44 tiết nháp" });
  expect(mocks.preview).toHaveBeenCalledTimes(1);
  expect(mocks.preview.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
  fireEvent.click(screen.getByRole("button", { name: /23–28\/11/ }));
  fireEvent.click(screen.getByRole("button", { name: /30\/11–05\/12/ }));
  expect(mocks.preview).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(mocks.preview).toHaveBeenCalledTimes(2));
  expect(mocks.preview.mock.calls[1][0].weekStarts).toEqual(["2026-11-16"]);
});

it("creates the draft then opens the new batch", async () => {
  renderDialog();
  fireEvent.click(await screen.findByRole("button", { name: "Tạo 44 tiết nháp" }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
  expect(mocks.navigate.mock.calls[0][0].href).toContain("batchId=b9");
});

it("disables create when nothing would be created", async () => {
  mocks.preview.mockResolvedValue({ ...PREVIEW, totalToCreate: 0 });
  renderDialog();
  expect(await screen.findByRole("button", { name: "Tạo 0 tiết nháp" })).toBeDisabled();
});

it("lists several excluded periods", () => {
  expect(excludedSentence([{ periodNo: 6, weekday: 3 }, { periodNo: 2, weekday: 5 }])).toBe(" Tiết đang trùng (Thứ 4 tiết 6, Thứ 6 tiết 2) sẽ không được copy.");
  expect(excludedSentence([])).toBe("");
  expect(reuseWeekDetail(PREVIEW.weeks[0] as never)).toBe("20/11 Nhà giáo VN · bỏ 6 tiết");
});
