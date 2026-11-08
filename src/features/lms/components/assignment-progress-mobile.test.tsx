import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AssignmentRun } from "@/domain/school/classroom-types";
import { AssignmentProgressMobile } from "@/features/lms/components/assignment-progress-mobile";
import type { ProgressMobileRow } from "@/features/lms/components/assignment-progress-mobile/progress-student-row";
import { HomeworkProgressPage } from "@/features/lms/components/homework-progress-page";
import { canSendCampaigns } from "@/features/notification-campaigns/model/can-send-campaigns";

const navigate = vi.fn();
const mutate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/features/notification-campaigns/api/campaign-query", () => ({
  useCreateCampaign: () => ({ isPending: false, mutate }),
}));
vi.mock("@/features/notification-campaigns/model/can-send-campaigns", () => ({ canSendCampaigns: vi.fn(() => true) }));

const run = { id: "a1", title: "Luyện tập: Phương trình bậc nhất", dueLabel: "Hạn 20:00 hôm nay" } as AssignmentRun;

const rows: ProgressMobileRow[] = [
  { id: "s1", name: "Lê Tuấn Kiệt", userId: "u1", score: null, status: "notstarted", timestamp: "—" },
  { id: "s2", name: "Phạm Quang Hải", userId: "u2", score: null, status: "inprogress", timestamp: "08/11 19:05" },
  { id: "s3", name: "Trần Ngọc Vy", userId: "u3", score: 90, status: "completed", timestamp: "08/11 18:00" },
  { id: "s4", name: "Đỗ Hải Nam", userId: "u4", score: 70, status: "completed", timestamp: "08/11 18:30" },
];

function renderView(list = rows) {
  return render(
    <AssignmentProgressMobile
      classLabel="7A"
      counts={{ completed: list.filter((r) => r.status === "completed").length, needsReview: 1, total: list.length }}
      onBack={vi.fn()}
      rows={list}
      run={run}
      status="ready"
    />,
  );
}

const listNames = () => within(screen.getByRole("list", { name: "Danh sách học sinh" })).getAllByRole("listitem").map((li) => li.textContent);

afterEach(() => {
  cleanup();
  navigate.mockClear();
  mutate.mockClear();
  vi.mocked(canSendCampaigns).mockReturnValue(true);
});

describe("AssignmentProgressMobile (N10)", () => {
  it("renders the ring percent, counts and the not-submitted rows by default", () => {
    renderView();
    expect(screen.getByRole("img", { name: "Đã nộp 50%" })).toBeTruthy();
    expect(screen.getByText("2 / 4")).toBeTruthy();
    expect(screen.getByText("7A · Hạn 20:00 hôm nay")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Chưa nộp 2" }).getAttribute("aria-selected")).toBe("true");
    const items = listNames();
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("Lê Tuấn Kiệt");
    expect(items[0]).toContain("TK");
  });

  it("filters rows with the segmented control", () => {
    renderView();
    fireEvent.click(screen.getByRole("tab", { name: "Đã nộp 2" }));
    expect(listNames().join()).toContain("90/100 điểm");
    expect(listNames()).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: "Đang làm 1" }));
    expect(listNames()).toEqual([expect.stringContaining("Phạm Quang Hải")]);
  });

  it("has exactly one contained button: the reminder for the not-submitted students", () => {
    renderView();
    const button = screen.getByRole("button", { name: "Nhắc 2 học sinh chưa nộp" });
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(button.className).toContain("MuiButton-contained");
    fireEvent.click(button);
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ audience: { userIds: ["u1", "u2"] } }), expect.anything());
  });

  it("hides the reminder when everyone has submitted", () => {
    renderView(rows.filter((r) => r.status === "completed"));
    expect(screen.queryByRole("button", { name: /^Nhắc/ })).toBeNull();
  });

  it("disables the reminder with a reason when sending is not allowed or accounts are missing", () => {
    vi.mocked(canSendCampaigns).mockReturnValue(false);
    renderView();
    expect((screen.getByRole("button", { name: "Nhắc 2 học sinh chưa nộp" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Tài khoản chưa có quyền gửi thông báo.")).toBeTruthy();
    cleanup();
    vi.mocked(canSendCampaigns).mockReturnValue(true);
    renderView(rows.map((r) => (r.id === "s1" ? { ...r, userId: undefined } : r)));
    expect((screen.getByRole("button", { name: "Nhắc 2 học sinh chưa nộp" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("is what HomeworkProgressPage renders on a phone", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <HomeworkProgressPage onBack={vi.fn()} runs={[run]} students={[]} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Tiến độ học tập" })).toBeTruthy();
    // API-backed in tests: the page's own queries are loading, shown as the in-shell skeleton.
    expect(screen.getByRole("status", { name: "Đang tải nội dung" })).toBeTruthy();
  });
});
