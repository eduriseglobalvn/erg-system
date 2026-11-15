import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { period, week } from "../test/class-log-test-data";
import { TeacherWeekPanel } from "./teacher-week-panel";

const api = vi.hoisted(() => ({ loadTeacherWeek: vi.fn(), updateLessonLogEntry: vi.fn(), confirmLessonLogWeek: vi.fn() }));
vi.mock("../api/class-log-api", () => api);
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TeacherWeekPanel onCurriculum={vi.fn()} onWeek={vi.fn()} weekStart="2026-11-09" />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe("teacher week panel", () => {
  it("shows the pending count on the confirm button and locks it at zero", async () => {
    api.loadTeacherWeek.mockResolvedValue(week([period()], { taught: 10, confirmed: 8, pending: 2 }));
    const first = renderPanel();
    expect(await screen.findByRole("button", { name: "Xác nhận 2 tiết" })).toBeEnabled();
    first.unmount();

    api.loadTeacherWeek.mockResolvedValue(week([period()], { taught: 10, confirmed: 10, pending: 0 }));
    renderPanel();
    expect(await screen.findByRole("button", { name: "Xác nhận 0 tiết" })).toBeDisabled();
  });

  it("flags a lagging period with the wording and falls back when the lesson is missing", async () => {
    api.loadTeacherWeek.mockResolvedValue(week([period({ ppctPeriod: 10, actualPeriod: 8, lessonTitle: null })], { taught: 1, confirmed: 0, pending: 1 }));
    renderPanel();
    expect(await screen.findByText("Chậm 2 tiết so với PPCT")).toBeInTheDocument();
    expect(screen.getByText("Chưa có trong KCT")).toBeInTheDocument();
  });

  it("autosaves a comment once, 600 ms after the last key, with the version it was read at", async () => {
    api.loadTeacherWeek.mockResolvedValue(week([period({ version: 3 })], { taught: 1, confirmed: 0, pending: 1 }));
    api.updateLessonLogEntry.mockResolvedValue(period({ version: 4, comment: "Tốt" }));
    renderPanel();
    const input = await screen.findByLabelText("Nhận xét · 6A1 · tiết 1");
    fireEvent.change(input, { target: { value: "Tố" } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    fireEvent.change(input, { target: { value: "Tốt" } });
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(api.updateLessonLogEntry).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(300));
    await waitFor(() => expect(api.updateLessonLogEntry).toHaveBeenCalledTimes(1));
    expect(api.updateLessonLogEntry).toHaveBeenCalledWith(expect.objectContaining({ eventId: "e1", actualPeriod: 10, comment: "Tốt", expectedVersion: 3 }));
  });

  it("changes the lesson title and the lag note once the new actual period is saved", async () => {
    api.loadTeacherWeek.mockResolvedValue(week([period({ lessonTitle: "Bài 7" })], { taught: 1, confirmed: 0, pending: 1 }));
    api.updateLessonLogEntry.mockResolvedValue(period({ actualPeriod: 8, lessonTitle: "Bài 5", version: 1 }));
    renderPanel();
    expect(await screen.findByText("Bài 7")).toBeInTheDocument();
    // The save invalidates the week, so the refetch must already return the saved period.
    api.loadTeacherWeek.mockResolvedValue(week([period({ actualPeriod: 8, lessonTitle: "Bài 5", version: 1 })], { taught: 1, confirmed: 0, pending: 1 }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /Tiết thực tế/ }));
    fireEvent.click(await screen.findByRole("option", { name: "8" }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(await screen.findByText("Bài 5")).toBeInTheDocument();
    expect(screen.getByText("Chậm 2 tiết so với PPCT")).toBeInTheDocument();
  });
});
