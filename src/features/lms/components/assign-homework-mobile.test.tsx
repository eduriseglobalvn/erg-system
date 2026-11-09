import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { classroomSnapshots } from "@/test/fixtures/mock-classroom-data";
import { createLmsAssignment } from "@/features/lms/api/lms-assignment-command-api";
import { AssignHomeworkPage } from "@/features/lms/components/assign-homework-page";

vi.mock("@/features/question-bank/api/question-bank-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/question-bank/api/question-bank-query")>()),
  // The assign wizard offers only published bank quizzes; give it one.
  useQuestionBankWorkspaceQuery: () => ({
    data: {
      quizzes: [{
        id: "quiz-published", title: "Thiết bị và hệ điều hành", status: "ready", kind: "train",
        subjectId: "subject-ic3", subjectLabel: "IC3 GS6", levelId: "level-1", levelLabel: "Level 1",
        topicLabels: ["Căn bản về công nghệ"], questionIds: ["q1", "q2"], questionCount: 2, durationLabel: "15 phút",
      }],
    },
  }),
}));

vi.mock("@/features/lms/api/lms-assignment-command-api", () => ({
  createLmsAssignment: vi.fn().mockResolvedValue({ assignmentId: "mock-assign-1", recipientCount: 2, resources: [] }),
}));

vi.mock("@/features/lms/api/lms-classroom-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/lms/api/lms-classroom-api")>();
  return {
    ...actual,
    loadLmsClassWorkspace: vi.fn().mockResolvedValue({
      classInfo: { id: "class-6a1", name: "Lớp 6A1", grade: "6", schoolId: "school-erg-alpha" },
      students: {
        items: [
          { id: "s1", fullName: "Nguyễn Văn A", status: "ACTIVE", studentCode: "HS01" },
          { id: "s2", fullName: "Trần Thị B", status: "ACTIVE", studentCode: "HS02" },
        ],
        page: 0,
        size: 50,
        totalItems: 2,
        totalPages: 1,
      },
      assignments: { items: [], page: 0, size: 50, totalItems: 0, totalPages: 0 },
    }),
  };
});

function setPhone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderPage(phone: boolean) {
  setPhone(phone);
  const onCreateAssignment = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AssignHomeworkPage classes={classroomSnapshots} selectedClass={classroomSnapshots[0]} onBack={vi.fn()} onCreateAssignment={onCreateAssignment} />
    </QueryClientProvider>,
  );
  return { onCreateAssignment };
}

const sendButton = () => screen.getByRole("button", { name: /^Giao cho \d+ học sinh$/ });

afterEach(() => {
  cleanup();
  vi.mocked(createLmsAssignment).mockClear();
});

describe("AssignHomeworkMobile (N8)", () => {
  it("renders the numbered sections and exactly one contained button", async () => {
    renderPage(true);

    for (const heading of ["1 · Nội dung", "2 · Giao cho", "3 · Thời gian", "4 · Cách làm bài"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeDefined();
    }
    expect(screen.queryByRole("button", { name: "Tiếp theo" })).toBeNull();
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(sendButton().className).toContain("MuiButton-contained");
  });

  it("stays disabled with the reason until the form is valid", async () => {
    renderPage(true);
    await waitFor(() => expect(sendButton().textContent).toBe("Giao cho 2 học sinh"));

    expect(sendButton()).toHaveProperty("disabled", true);
    expect(screen.getByText("Vui lòng nhập tên bài tập.")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("Nhập tên bài tập"), { target: { value: "Bài 15 phút" } });
    expect(sendButton()).toHaveProperty("disabled", false);
    expect(screen.queryByText("Vui lòng nhập tên bài tập.")).toBeNull();
  });

  it("updates the footer count when students are unticked", async () => {
    renderPage(true);
    await waitFor(() => expect(sendButton().textContent).toBe("Giao cho 2 học sinh"));

    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    const sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("checkbox", { name: "Chọn Nguyễn Văn A" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "Đóng" }));

    await waitFor(() => expect(sendButton().textContent).toBe("Giao cho 1 học sinh"));
  });

  it("submits the same payload as the desktop wizard", async () => {
    const desktop = renderPage(false);
    await waitFor(() => expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThan(0));
    fireEvent.change(screen.getByPlaceholderText("Nhập tên bài tập..."), { target: { value: "Bài so sánh" } });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await screen.findByText("Chọn bài tập");
    fireEvent.click(screen.getByRole("button", { name: "Giao bài" }));
    await waitFor(() => expect(desktop.onCreateAssignment).toHaveBeenCalledWith("Bài so sánh", expect.any(String)));
    const wizardPayload = vi.mocked(createLmsAssignment).mock.calls[0]?.[0];
    cleanup();

    const mobile = renderPage(true);
    await waitFor(() => expect(sendButton().textContent).toBe("Giao cho 2 học sinh"));
    fireEvent.change(screen.getByPlaceholderText("Nhập tên bài tập"), { target: { value: "Bài so sánh" } });
    fireEvent.click(sendButton());
    await waitFor(() => expect(mobile.onCreateAssignment).toHaveBeenCalledWith("Bài so sánh", expect.any(String)));

    expect(wizardPayload).toBeDefined();
    expect(vi.mocked(createLmsAssignment).mock.calls[1]?.[0]).toEqual(wizardPayload);
  });
});
