import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { THANKS_MESSAGE } from "./student-question-thread-pane";
import { StudentInboxView } from "./student-inbox-view";

const mocks = vi.hoisted(() => ({
  loadMyQuestionThreads: vi.fn(),
  loadQuestionThread: vi.fn(),
  sendQuestionThreadMessage: vi.fn(),
  askTeacherAboutQuestion: vi.fn(),
  fetchNotificationFeed: vi.fn(),
  mobile: false,
}));

vi.mock("../api/student-question-thread-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/student-question-thread-api")>()),
  loadMyQuestionThreads: mocks.loadMyQuestionThreads,
  loadQuestionThread: mocks.loadQuestionThread,
  sendQuestionThreadMessage: mocks.sendQuestionThreadMessage,
  askTeacherAboutQuestion: mocks.askTeacherAboutQuestion,
}));
vi.mock("@/features/notifications/api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/notifications/api/notification-api")>()),
  fetchNotificationFeed: mocks.fetchNotificationFeed,
  resolveNotificationQueryScope: () => ({ accountId: "acc-1", tenantId: "t-1" }),
}));
vi.mock("@/features/notifications/components/mark-all-read-button", () => ({ MarkAllReadButton: () => null }));
vi.mock("@/features/notifications/components/notification-detail", () => ({ NotificationDetail: () => <div>notification-detail</div> }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.mobile }));

const now = new Date().toISOString();
const summary = {
  id: "th-1", assignmentId: "as-1", assignmentTitle: "Phương trình bậc nhất", subjectName: "Toán", className: "Lớp 7A", questionIndex: 7,
  questionPrompt: "2x + 5 = 13", studentAnswerText: "x = 9", correctAnswerText: "x = 4", teacherId: "te-1", teacherName: "Trần Thị Hạnh",
  status: "ANSWERED", unread: true, lastMessageAt: now, lastMessagePreview: "Em chuyển 5 sang vế phải", messages: [],
};
const detail = {
  ...summary,
  messages: [
    { id: "m1", senderId: "s", senderName: "Minh Anh", senderRole: "STUDENT", mine: true, body: "Em sai ở đâu ạ?", attachmentIds: [], createdAt: now },
    { id: "m2", senderId: "te-1", senderName: "Trần Thị Hạnh", senderRole: "TEACHER", mine: false, body: "Phải đổi dấu thành -5 nhé.", attachmentIds: [], createdAt: now },
  ],
};
const note = { id: "n1", title: "Bài mới: Kiểm tra 15 phút", bodyPreview: "Cô Hạnh", createdAt: now, unread: true, eventType: "assignment", type: "general", campaignId: undefined, senderName: undefined };

function renderView(props: Partial<Parameters<typeof StudentInboxView>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><StudentInboxView portal="elearning" {...props} /></QueryClientProvider>);
}

describe("StudentInboxView", () => {
  beforeEach(() => {
    mocks.mobile = false;
    mocks.loadMyQuestionThreads.mockResolvedValue([summary]);
    mocks.loadQuestionThread.mockResolvedValue(detail);
    mocks.fetchNotificationFeed.mockResolvedValue({ items: [note] });
    mocks.sendQuestionThreadMessage.mockReset().mockResolvedValue(detail);
  });

  test("web: merges threads and notifications and opens the newest thread with the question card", async () => {
    renderView();
    expect(await screen.findByText("Phải đổi dấu thành -5 nhé.")).toBeTruthy();
    expect(screen.getByText("Cô Trần Thị Hạnh đã trả lời câu 7")).toBeTruthy();
    expect(screen.getByText("Bài mới: Kiểm tra 15 phút")).toBeTruthy();
    expect(screen.getByText("2x + 5 = 13 · bạn chọn x = 9 · đáp án x = 4")).toBeTruthy();
    expect(screen.getByText("Phương trình bậc nhất · Câu 7")).toBeTruthy();
  });

  test("chip filters to question threads only", async () => {
    renderView();
    await screen.findByText("Bài mới: Kiểm tra 15 phút");
    fireEvent.click(screen.getByRole("tab", { name: /Hỏi giáo viên/ }));
    await waitFor(() => expect(screen.queryByText("Bài mới: Kiểm tra 15 phút")).toBeNull());
  });

  test("\"Cảm ơn cô\" sends the thanks message; \"Làm lại câu 7\" only for PRACTICE and opens the assignment", async () => {
    const onOpenAssignment = vi.fn();
    renderView({ assignments: [{ id: "as-1", kind: "PRACTICE" }], onOpenAssignment });
    fireEvent.click(await screen.findByText("Cảm ơn cô"));
    await waitFor(() => expect(mocks.sendQuestionThreadMessage).toHaveBeenCalledWith("th-1", THANKS_MESSAGE));
    fireEvent.click(screen.getByText("Làm lại câu 7"));
    expect(onOpenAssignment).toHaveBeenCalledWith("as-1");
  });

  test("no redo chip for a TEST assignment", async () => {
    renderView({ assignments: [{ id: "as-1", kind: "TEST" }], onOpenAssignment: vi.fn() });
    await screen.findByText("Cảm ơn cô");
    expect(screen.queryByText("Làm lại câu 7")).toBeNull();
  });

  test("composer sends typed text", async () => {
    renderView();
    fireEvent.change(await screen.findByLabelText("Tin nhắn cho giáo viên"), { target: { value: "  Em hiểu rồi  " } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    await waitFor(() => expect(mocks.sendQuestionThreadMessage).toHaveBeenCalledWith("th-1", "Em hiểu rồi"));
  });

  test("search filters the loaded list by title and excerpt", async () => {
    renderView();
    await screen.findByText("Bài mới: Kiểm tra 15 phút");
    fireEvent.change(screen.getByPlaceholderText("Tìm trong hộp thư"), { target: { value: "vế phải" } });
    await waitFor(() => expect(screen.queryByText("Bài mới: Kiểm tra 15 phút")).toBeNull());
    expect(screen.getByText("Cô Trần Thị Hạnh đã trả lời câu 7")).toBeTruthy();
  });

  test("unread count shows on the Hỏi giáo viên chip", async () => {
    renderView();
    await screen.findByText("Bài mới: Kiểm tra 15 phút");
    expect(screen.getByRole("tab", { name: /Hỏi giáo viên/ }).textContent).toContain("1");
  });

  test("Hỏi giáo viên opens a new thread for the chosen assignment and question", async () => {
    mocks.askTeacherAboutQuestion.mockResolvedValue(detail);
    renderView({ assignments: [{ id: "as-1", title: "Phương trình bậc nhất" }] });
    fireEvent.click(await screen.findByRole("button", { name: /Hỏi giáo viên/ }));
    fireEvent.mouseDown(await screen.findByLabelText("Bài tập"));
    fireEvent.click(await screen.findByRole("option", { name: "Phương trình bậc nhất" }));
    fireEvent.change(screen.getByLabelText("Câu số"), { target: { value: "3" } });
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tin nhắn cho giáo viên"), { target: { value: " Cô giảng lại ạ " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Gửi" }));
    await waitFor(() => expect(mocks.askTeacherAboutQuestion).toHaveBeenCalledWith("as-1", 3, "Cô giảng lại ạ"));
  });

  test("phone: list first, a row opens the chat, back returns", async () => {
    mocks.mobile = true;
    renderView();
    fireEvent.click(await screen.findByText("Cô Trần Thị Hạnh đã trả lời câu 7"));
    expect(await screen.findByLabelText("Tin nhắn cho giáo viên")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại Hộp thư" }));
    expect(await screen.findByText("Bài mới: Kiểm tra 15 phút")).toBeTruthy();
  });

  test("phone list has the Hỏi giáo viên entry that opens the compose dialog", async () => {
    mocks.mobile = true;
    renderView({ assignments: [{ id: "as-1", title: "Phương trình bậc nhất" }] });
    expect(await screen.findByRole("heading", { name: "Hộp thư" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Hỏi giáo viên/ }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  test("empty and error states", async () => {
    mocks.loadMyQuestionThreads.mockResolvedValue([]);
    mocks.fetchNotificationFeed.mockResolvedValue({ items: [] });
    const { unmount } = renderView();
    expect(await screen.findByText("Hộp thư trống.")).toBeTruthy();
    unmount();
    mocks.loadMyQuestionThreads.mockRejectedValue(new Error("x"));
    mocks.fetchNotificationFeed.mockRejectedValue(new Error("x"));
    renderView();
    expect(await screen.findByText("Không tải được hộp thư")).toBeTruthy();
  });
});
