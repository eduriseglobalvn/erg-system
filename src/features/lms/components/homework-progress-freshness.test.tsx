import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssignmentRun } from "@/domain/school/classroom-types";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { loadLmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { HomeworkProgressPage } from "@/features/lms/components/homework-progress-page";

const reportRefetch = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/features/reporting/components/assignment-progress-export-control", () => ({ AssignmentProgressExportControl: () => null }));
vi.mock("@/features/lms/api/lms-assignment-progress-api", () => ({
  loadLmsAssignmentProgressWorkspace: vi.fn(async () => ({
    assignment: { resources: [] },
    attempts: { items: [] },
    recipients: { items: [] },
    summary: { needsReviewCount: 0 },
  })),
}));
vi.mock("@/features/quiz-reports", () => ({
  useAssignmentReportQuery: () => ({ data: undefined, dataUpdatedAt: 0, isFetching: false, isLoading: false, refetch: reportRefetch }),
  useQuizQuestionAnalyticsQuery: () => ({ data: undefined }),
}));

const run = { id: "a1", title: "Phương trình bậc nhất", dueLabel: "Hạn hôm nay" } as AssignmentRun;

function renderPage(phone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: phone, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HomeworkProgressPage onBack={vi.fn()} runs={[run]} students={[]} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.mocked(loadLmsAssignmentProgressWorkspace).mockClear();
  reportRefetch.mockClear();
});

describe.each([["desktop", false], ["phone", true]])("HomeworkProgressPage freshness (%s)", (_, phone) => {
  it("shows when the progress was loaded and reloads it on Làm mới", async () => {
    const before = Date.now();
    renderPage(phone);

    const label = await screen.findByText(/^Cập nhật lúc /);
    expect([formatDateTimeVi(before), formatDateTimeVi(Date.now())]).toContain(label.textContent?.replace("Cập nhật lúc ", ""));
    expect(loadLmsAssignmentProgressWorkspace).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));

    await waitFor(() => expect(loadLmsAssignmentProgressWorkspace).toHaveBeenCalledTimes(2));
    expect(reportRefetch).toHaveBeenCalledTimes(1);
  });
});
