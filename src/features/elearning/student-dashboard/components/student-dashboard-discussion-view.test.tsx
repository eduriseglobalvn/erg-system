import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DiscussionView } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-view";
import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type { StudentDiscussionComment, StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { createReactionSummary } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";

function comment(id: string, patch: Partial<StudentDiscussionComment>): StudentDiscussionComment {
  return { attachments: [], authorInitials: "GB", authorName: "Gia Bảo", content: id, createdAtLabel: "hôm qua 21:03", createdAtMs: 0, id, reactions: createReactionSummary(), replies: [], viewerReaction: null, ...patch };
}

// Design sample (H13): Toán thread by me with a teacher pick and a 2nd-level reply, a pinned teacher thread, an unanswered Ngữ văn thread.
const sample: StudentDiscussionFeedPost[] = [
  {
    acceptedReplyId: "c-teacher", attachments: [], authorInitials: "MA", authorName: "Minh Anh", className: "7A", createdAtLabel: "hôm qua 20:12", createdAtMs: 3,
    comments: [
      comment("c-gb", { content: "Mình đặt nhân tử chung luôn.", replies: [comment("c-ma", { authorInitials: "MA", authorName: "Minh Anh", content: "À hiểu rồi, cảm ơn Bảo và cô ạ!" })] }),
      comment("c-teacher", { authorInitials: "TH", authorName: "Cô Trần Thị Hạnh", content: "Đặt t = x + 2 thì t(t - 3) = 0." }),
    ],
    content: "Câu 4 trong đề ôn, có cách nào gọn hơn không?", following: false, id: "p-toan", mine: true,
    reactions: createReactionSummary(undefined, { love: 8 }), subject: "Toán", title: "Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?", viewerReaction: null,
  },
  { attachments: [], authorInitials: "TH", authorName: "Cô Hạnh", className: "7A", comments: [], content: "Lịch", createdAtLabel: "08/11", createdAtMs: 5, id: "p-pin", pinned: true, reactions: createReactionSummary(), subject: "Toán", title: "Lịch kiểm tra giữa kỳ I và phần cần ôn", viewerReaction: null },
  { attachments: [], authorInitials: "TL", authorName: "Thảo Linh", className: "7A", comments: [], content: "Danh từ", createdAtLabel: "hôm qua", createdAtMs: 1, id: "p-van", reactions: createReactionSummary(), subject: "Ngữ văn", title: "Phân biệt danh từ chung và danh từ riêng", viewerReaction: null },
];

function renderView() {
  const props = { copy: viCopy, onAddComment: vi.fn(), onCommentReaction: vi.fn(), onCreatePost: vi.fn(), onPostReaction: vi.fn(), onToggleFollow: vi.fn(), posts: sample, studentClass: "7A", viewerName: "Minh Anh" };
  render(<DiscussionView {...props} />);
  return props;
}

describe("DiscussionView", () => {
  it("lists the pinned thread first with its marker, and filters by subject", () => {
    renderView();
    const rows = screen.getAllByRole("button").filter((button) => /Lịch kiểm tra|Phân biệt danh từ|Ôn tập chương 2/u.test(button.textContent ?? ""));
    expect(rows[0].textContent).toContain("Cô ghim");
    expect(rows[0].textContent).toContain("Lịch kiểm tra giữa kỳ I");
    expect(screen.getByRole("button", { name: /Chưa có trả lời/u }).textContent).toContain("2");
    fireEvent.click(screen.getByRole("button", { name: "Ngữ văn" }));
    expect(screen.queryByRole("button", { name: /Lịch kiểm tra/u })).toBeNull();
    expect(screen.getByRole("button", { name: /Phân biệt danh từ/u })).toBeTruthy();
  });

  it("shows the teacher pick first with its label, the 2nd-level reply and the Bạn badge", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: /Ôn tập chương 2/u }));
    expect(screen.getByText("Giáo viên chọn là lời giải hay")).toBeTruthy();
    const teacher = screen.getByText("Đặt t = x + 2 thì t(t - 3) = 0.");
    const gia = screen.getByText("Mình đặt nhân tử chung luôn.");
    expect(teacher.compareDocumentPosition(gia) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("À hiểu rồi, cảm ơn Bảo và cô ạ!")).toBeTruthy();
    expect(screen.getByText("Bạn")).toBeTruthy();
  });

  it("replies to a comment through its root and toggles follow", () => {
    const props = renderView();
    fireEvent.click(screen.getByRole("button", { name: /Ôn tập chương 2/u }));
    const giaBlock = screen.getByText("Mình đặt nhân tử chung luôn.").parentElement as HTMLElement;
    fireEvent.click(within(giaBlock).getByRole("button", { name: "Trả lời" }));
    fireEvent.change(screen.getByPlaceholderText("Trả lời Gia Bảo..."), { target: { value: "Cảm ơn bạn" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Gửi/u })[0]);
    expect(props.onAddComment).toHaveBeenCalledWith("p-toan", "c-gb", "Cảm ơn bạn", []);
    fireEvent.click(screen.getAllByRole("button", { name: /Theo dõi/u })[0]);
    expect(props.onToggleFollow).toHaveBeenCalledWith("p-toan");
  });
});
