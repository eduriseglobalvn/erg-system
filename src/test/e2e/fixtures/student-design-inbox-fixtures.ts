// Inbox (H12, H12m) and discussion (H13, H13m, H13m2) data of the design canvas. Texts copied from the baseline PNGs.
// Clock of the artboards: Thu 12/11/2026 16:00 (+07:00), see DESIGN_NOW.
const at = (day: string, time: string) => `2026-11-${day}T${time}:00+07:00`;

const note = (id: string, eventType: string, title: string, bodyPreview: string, createdAt: string, unread: boolean, extra: object = {}) => ({
  id, eventType, sourceType: eventType, title, bodyPreview, createdAt, status: unread ? "unread" : "read", readAt: unread ? null : createdAt, channel: "inbox", ...extra,
});

/** `GET /api/v1/notifications`: five notices under the question thread (H12 list). */
export const notificationFeed = {
  hasNext: false, hasPrevious: false, page: 0, size: 50, totalItems: 5, totalPages: 1,
  items: [
    note("n1", "CLASS_ANNOUNCEMENT", "Bài mới: Kiểm tra 15 phút Đơn thức", "Cô Hạnh · hạn 20:00 hôm nay · +40 XP", at("12", "07:00"), true, { senderName: "Cô Hạnh" }),
    note("n2", "DISCUSSION_REPLY", "Gia Bảo trả lời bạn trong “Ôn tập chương 2”", "Mình làm câu 4 theo cách đặt ẩn phụ…", at("11", "21:03"), false),
    note("n3", "LEADERBOARD_RANK_UP", "Bạn lên hạng #4 lớp 7A", "Còn 40 XP nữa là vào top 3 tuần này", at("11", "18:00"), false),
    note("n4", "CENTER_ANNOUNCEMENT", "Nghỉ học thứ Sáu 20/11", "Chào mừng Ngày Nhà giáo Việt Nam", at("05", "09:00"), false, { campaignId: "campaign-1", senderName: "Trung tâm" }),
    note("n5", "BADGE_EARNED", "Bạn nhận huy hiệu “Bền bỉ”", "Giữ chuỗi 7 ngày liên tiếp", at("02", "09:00"), false),
  ],
};
/** Sidebar badge "2" and the dock dot of the canvas. */
export const notificationUnread = { unread: 2 };

const thread = {
  id: "thread-1", assignmentId: "a1", assignmentTitle: "Luyện tập: Phương trình bậc nhất", subjectName: "Toán", className: "Lớp 7A", questionIndex: 7,
  questionPrompt: "2x + 5 = 13", studentAnswerText: "x = 9", correctAnswerText: "x = 4", teacherId: "teacher-1", teacherName: "Trần Thị Hạnh",
  status: "ANSWERED", lastMessageAt: at("12", "07:55"), lastMessagePreview: "Em chuyển 5 sang vế phải thì phải đổi dấu…", unread: true,
};
const message = (id: string, mine: boolean, body: string, createdAt: string) => ({
  id, senderId: mine ? "student-smoke" : "teacher-1", senderName: mine ? "Nguyễn Minh Anh" : "Trần Thị Hạnh", senderRole: mine ? "STUDENT" : "TEACHER", mine, body, attachmentIds: [], createdAt,
});
export const questionThreadDetail = {
  ...thread,
  messages: [
    message("m1", true, "Cô ơi, câu 7 em chuyển 5 sang vế phải rồi cộng vào 13 nên ra 2x = 18. Em sai ở đâu ạ?", at("11", "20:30")),
    message("m2", false, "Em chuyển 5 sang vế phải thì phải đổi dấu thành -5 nhé: 2x = 13 - 5 = 8, nên x = 4.\nEm thử làm lại câu 8 cùng dạng, cô thấy em làm được rồi đó.", at("12", "07:55")),
  ],
};

const hearts = (count: number) => (count ? [{ reaction: "love", count }] : []);
const reply = (id: string, parentId: string | null, authorId: string, authorName: string, authorInitials: string, content: string, createdAt: string, count: number, extra: object = {}) => ({
  id, parentId, authorId, authorName, authorInitials, content, createdAt, attachmentIds: [], viewerReaction: null, reactions: hearts(count), replies: [], ...extra,
});
/** Placeholder replies so a row shows the canvas reply count; their text is never on a canvas. */
const filler = (postId: string, n: number, createdAt: string) =>
  Array.from({ length: n }, (_, i) => reply(`${postId}-c${i}`, null, "student-x", "Bạn lớp", "BL", "Mình cũng thắc mắc.", createdAt, 0));
const post = (id: string, o: Record<string, unknown>) => ({
  authorId: "student-x", authorInitials: "", academicClassId: "class-7a", className: "7A", content: "", attachmentIds: [], assignmentId: null,
  pinned: false, acceptedReplyId: null, following: false, viewerReaction: null, comments: [], reactions: [], ...o, id,
});

function discussionPosts() {
  return [
    post("p-pin", {
      authorId: "teacher-1", authorName: "Cô Hạnh", authorInitials: "TH", title: "Lịch kiểm tra giữa kỳ I và phần cần ôn", content: "Lịch kiểm tra giữa kỳ I và phần cần ôn",
      subject: "Toán", pinned: true, createdAt: at("08", "09:00"), reactions: hearts(21), comments: filler("p-pin", 4, at("08", "10:00")),
    }),
    post("p-ma", {
      authorId: "student-smoke", authorName: "Minh Anh", authorInitials: "MA", title: "Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?",
      content: "Câu 4 trong đề ôn: (x + 2)² - 3(x + 2) = 0. Mình khai triển ra thì dài quá, có cách nào gọn hơn không mọi người?", subject: "Toán",
      createdAt: at("11", "20:12"), acceptedReplyId: "c-teacher", following: false, reactions: hearts(8),
      comments: [
        reply("c-teacher", null, "teacher-1", "Cô Trần Thị Hạnh", "TH", "Đặt t = x + 2 thì thành t² - 3t = 0 ⇒ t(t - 3) = 0. Vậy x + 2 = 0 hoặc x + 2 = 3, tức x = -2 hoặc x = 1.", at("11", "20:40"), 12, { viewerReaction: "love" }),
        reply("c-gb", null, "student-gb", "Gia Bảo", "GB", "Mình cũng đặt ẩn phụ, nhưng mình đặt nhân tử chung (x + 2) luôn: (x + 2)(x + 2 - 3) = 0, nhanh hơn một bước.", at("11", "21:03"), 5, {
          replies: [reply("r-ma", "c-gb", "student-smoke", "Minh Anh", "MA", "À hiểu rồi, cảm ơn Bảo và cô ạ!", at("12", "07:40"), 2)],
        }),
      ],
    }),
    post("p-tl", {
      authorId: "student-tl", authorName: "Thảo Linh", authorInitials: "TL", title: "Phân biệt danh từ chung và danh từ riêng trong bài 3",
      content: "Phân biệt danh từ chung và danh từ riêng trong bài 3", subject: "Ngữ văn", createdAt: at("11", "15:00"), reactions: hearts(2),
    }),
    post("p-qh", {
      authorId: "student-qh", authorName: "Quang Hải", authorInitials: "QH", title: "Unit 4: “interested in” hay “interested on”?",
      content: "Unit 4: “interested in” hay “interested on”?", subject: "Tiếng Anh", createdAt: at("10", "09:00"), acceptedReplyId: "p-qh-c0",
      reactions: hearts(6), comments: filler("p-qh", 5, at("10", "10:00")),
    }),
    post("p-nv", {
      authorId: "student-nv", authorName: "Ngọc Vy", authorInitials: "NV", title: "Câu 9 bài KHTN nguyên tử có đáp án không ạ?",
      content: "Câu 9 bài KHTN nguyên tử có đáp án không ạ?", subject: "KHTN", createdAt: at("09", "09:00"), reactions: hearts(1),
    }),
  ];
}

/** GraphQL `data` by operation name (inbox + discussion). */
export const inboxGraphQlFixtures: Record<string, unknown> = {
  ElearningMyQuestionThreads: { elearning: { myQuestionThreads: [thread] } },
  ElearningQuestionThread: { elearning: { questionThread: questionThreadDetail } },
  ElearningStudentDiscussionFeed: { elearning: { discussionFeed: { page: 0, size: 20, totalItems: 5, hasNext: false, items: discussionPosts() } } },
};
