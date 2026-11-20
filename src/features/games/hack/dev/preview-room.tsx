// DEV ONLY: /student/games/preview?screen=<id>&kind=<question kind> renders one screen from a fixed state,
// without a socket or backend. Reached through a dynamic import behind import.meta.env.DEV, so it is not in production builds.
import type { Question } from "@/domain/quiz/types";
import type { PlayerState, RoomSummary } from "@/features/games/game-types";
import { HackRoomView } from "@/features/games/hack/hack-room";
import { initialRoomViewState, type RoomViewState } from "@/features/games/room-state";

const feedback = { correct: "", incorrect: "", partial: "" };
const base = { points: 1, feedback };

const HOTSPOT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="256"><rect width="640" height="400" fill="gainsboro"/><rect width="640" height="30" fill="darkslategray"/><rect y="30" width="640" height="40" fill="white"/><rect x="330" y="38" width="60" height="24" fill="none" stroke="gray"/><rect y="70" width="120" height="186" fill="whitesmoke"/></svg>')}`;

const QUESTIONS: Record<string, Question> = {
  single_choice: { ...base, id: "q1", kind: "single_choice", title: "Phần mở rộng nào sau đây là của một tệp hình ảnh?", choices: [".docx", ".png", ".mp3", ".xlsx"].map((label, index) => ({ id: `c${index}`, label, correct: index === 1 })) },
  true_false: { ...base, id: "q2", kind: "true_false", title: "Khi xóa một tệp khỏi USB, tệp đó được chuyển vào Thùng rác (Recycle Bin) của máy tính.", choices: [{ id: "t", label: "Đúng", correct: false }, { id: "f", label: "Sai", correct: true }] },
  multiple_response: { ...base, id: "q3", kind: "multiple_response", title: "Những phần mở rộng nào sau đây là của tệp hình ảnh?", choices: [".png", ".docx", ".jpg", ".mp3", ".gif", ".xlsx"].map((label, index) => ({ id: `m${index}`, label, correct: [0, 2, 4].includes(index) })) },
  short_answer: { ...base, id: "q4", kind: "short_answer", title: "Tổ hợp phím nào dùng để sao chép tệp đang chọn trên Windows?", textBlanks: [{ id: "b1", label: "", correctAnswers: ["Ctrl + C"] }] },
  numeric: { ...base, id: "q5", kind: "numeric", title: "Một USB còn trống 2 GB. Chép được tối đa bao nhiêu tệp video, mỗi tệp nặng 250 MB? (1 GB = 1 024 MB)", numericAnswer: { correctValue: 8, tolerance: 0, unit: "tệp" } },
  sequence: { ...base, id: "q6", kind: "sequence", title: "Sắp xếp các bước nén một thư mục thành tệp .zip trên Windows.", sequenceItems: ["Nhấp chuột phải vào thư mục", "Chọn Compressed (zipped) folder", "Chọn Send to", "Đặt tên cho tệp nén rồi nhấn Enter"].map((label, index) => ({ id: `s${index}`, label })) },
  matching: { ...base, id: "q7", kind: "matching", title: "Nối mỗi phần mở rộng với ứng dụng dùng để mở nó.", matching: [{ id: "p1", prompt: ".docx", response: "Microsoft Word" }, { id: "p2", prompt: ".xlsx", response: "Microsoft Excel" }, { id: "p3", prompt: ".pptx", response: "Microsoft PowerPoint" }] },
  fill_blank: { ...base, id: "q8", kind: "fill_blank", title: "Hoàn thành đoạn mô tả sau.", textBlanks: [{ id: "f1", label: "", correctAnswers: ["bit"], prefix: "Đơn vị nhỏ nhất để lưu thông tin là", suffix: "." }, { id: "f2", label: "", correctAnswers: ["byte"], prefix: "Tám đơn vị đó hợp thành một", suffix: "," }] },
  inline_choice: { ...base, id: "q9", kind: "inline_choice", title: "Chọn từ đúng cho mỗi chỗ trong đoạn sau.", inlineBlanks: [{ id: "i1", statement: "RAM là bộ nhớ", options: ["tạm thời", "vĩnh viễn"], correctOptionId: "tạm thời", suffix: ",", selectPosition: "after" }, { id: "i2", statement: "dữ liệu trong RAM sẽ", options: ["được giữ nguyên", "mất đi", "được nén lại"], correctOptionId: "mất đi", suffix: "khi tắt máy.", selectPosition: "after" }, { id: "i3", statement: "Ổ cứng thì thuộc loại bộ nhớ", options: ["tạm thời", "lâu dài"], correctOptionId: "lâu dài", suffix: ".", selectPosition: "after" }] },
  select_from_lists: { ...base, id: "q12", kind: "select_from_lists", title: "Phân loại từng thiết bị sau.", inlineBlanks: [["Bàn phím", "Thiết bị vào"], ["Màn hình", "Thiết bị ra"], ["Thẻ nhớ", "Lưu trữ"], ["Máy in", "Thiết bị ra"]].map(([statement, correctOptionId], index) => ({ id: `l${index}`, statement, options: ["Thiết bị vào", "Thiết bị ra", "Lưu trữ"], correctOptionId })) },
  hotspot: { ...base, id: "q13", kind: "hotspot", title: "Chạm vào nút dùng để đổi tên tệp đang chọn.", hotspotImage: { url: HOTSPOT_IMAGE, width: 640, height: 256 }, hotspotAreas: [{ id: "h1", shape: "rect", x: 330, y: 20, width: 60, height: 30, correct: true }] },
  drag_words: { ...base, id: "q10", kind: "drag_words", title: "Đặt đúng tổ hợp phím vào từng chỗ trống.", wordBank: [{ id: "w1", label: "Ctrl + S" }, { id: "w2", label: "Ctrl + V" }, { id: "w3", label: "Ctrl + Z" }], wordSlots: [{ id: "ws1", label: "Để lưu tệp ta nhấn", correctWordId: "w1", suffix: "," }, { id: "ws2", label: "để dán nhấn", correctWordId: "w2", suffix: "." }] },
  drag_drop: { ...base, id: "q11", kind: "drag_drop", title: "Xếp mỗi thiết bị vào đúng nhóm.", dropTargets: [{ id: "in", label: "THIẾT BỊ VÀO" }, { id: "out", label: "THIẾT BỊ RA" }], dragDropItems: [{ id: "d1", label: "Chuột", correctTargetId: "in" }, { id: "d2", label: "Máy in", correctTargetId: "out" }, { id: "d3", label: "Bàn phím", correctTargetId: "in" }] },
};

const me: PlayerState = { playerId: "me", displayName: "Minh Anh", stars: 1540, coins: 630, streak: 2, firewall: false, rank: 4, playerCount: 32, answeredCount: 11, correctCount: 9 };
const answerResult = { questionId: "q2", correct: false, correctAnswer: { correctChoiceIds: ["f"] }, solution: "Thùng rác chỉ giữ tệp xóa từ ổ cứng của máy. Tệp trên USB bị xóa thẳng, không khôi phục được từ Thùng rác. Vì vậy hãy sao lưu trước khi xóa.", starsGained: 0, me: { ...me, streak: 0, stars: 1760, coins: 950 }, requeueAfter: 3 };
const slots = [{ kind: "SCRAP", coins: 50 }, { kind: "BIG_WALLET", coins: 400 }, { kind: "EMPTY", coins: 0 }] as const;
const lootBefore = { ...me, rank: 4 };
const lootMe = { ...me, stars: 1660, coins: 950, streak: 3, firewall: true, rank: 3 };
const players = ["HOANG_BAO", "THU_KHANH", "GIA_HUY", "PHUONG_LINH", "DUC_TRI", "VAN_HA", "KHANH_LY", "QUOC_AN", "BAO_NGOC", "TUAN_KIET"].map((name, index) => ({ playerId: `p${index}`, displayName: name }));
const top = [["HOANG_BAO", 5480], ["THU_KHANH", 5120], ["GIA_HUY", 3840], ["Minh Anh", 2170], ["PHUONG_LINH", 2050]].map(([name, total], index) => ({ playerId: index === 3 ? "me" : `p${index}`, displayName: String(name), stars: 0, coins: 0, total: Number(total), rank: index + 1, firewall: index === 1 }));
const finalRows: [string, number, number][] = [["THU_KHANH", 2450, 3790], ["HOANG_BAO", 2280, 3430], ["Minh Anh", 2330, 1980], ["GIA_HUY", 1870, 2335], ["PHUONG_LINH", 2100, 1390], ["DUC_TRI", 1650, 1470], ["VAN_HA", 1760, 1120]];
const final = finalRows.map(([name, stars, coins], index) => ({ playerId: name === "Minh Anh" ? "me" : `p${index}`, displayName: name, stars, coins, total: stars + coins, rank: index + 1, correctCount: 17, answeredCount: 20, longestStreak: 6 }));

const room: RoomSummary = { id: "preview", gameType: "HACK", code: "4253", status: "RUNNING", classId: "c1", className: "7A2", quizTitle: "IC3 GS6 Level 1", durationMinutes: 10, rules: { allowHack: false, emergencyPatch: false, showLeaderboard: true, showSolution: true, allowLateJoin: false, questionOrder: "LESSON" }, playerCount: 32, questionCount: 20, createdAt: "2026-11-20T08:00:00" };

function stateFor(screen: string, kind: string): RoomViewState {
  const open: RoomViewState = { ...initialRoomViewState, connection: "open", phase: "RUNNING", endsAt: Date.now() + 222_000, me };
  const question = { index: 12, total: 20, question: QUESTIONS[kind] ?? QUESTIONS.single_choice };
  const withQuestion = { ...open, screen: "QUESTION" as const, question, marks: { 1: "ok", 2: "ok", 3: "ok", 4: "wrong", 5: "ok", 6: "ok", 7: "wrong", 8: "ok", 9: "ok", 10: "ok", 11: "ok" } as RoomViewState["marks"], leaderboard: { top, me: { rank: 4, total: 2170 } }, feed: [[231, "GIA_HUY giải mã ví nhỏ +150", "loot"], [234, "DUC_TRI vá lỗ hổng +64", "info"], [238, "THU_KHANH bật tường lửa", "firewall"]].map(([left, text, tone]) => ({ at: new Date((open.endsAt ?? 0) - Number(left) * 1000).toISOString(), text: String(text), tone: String(tone) })) };
  switch (screen) {
    case "lobby":
      return { ...open, phase: "LOBBY", screen: "LOBBY", lobby: { players, count: 28, classSize: 32 } };
    case "countdown":
      return { ...open, phase: "COUNTDOWN", screen: "COUNTDOWN", countdownStartsAt: Date.now() + 2_500 };
    case "wrong":
      return { ...withQuestion, screen: "EXPLAIN", answerResult };
    case "loot":
      return { ...withQuestion, screen: "LOOT_PICK", me: { ...lootMe, coins: 550, rank: 4 }, answerResult: { ...answerResult, correct: true, starsGained: 120, me: lootMe }, lootOffered: true };
    case "loot-open":
      return { ...withQuestion, rankBeforeLoot: lootBefore.rank, screen: "LOOT_RESULT", me: lootMe, lootResult: { pickedSlot: 1, slots: slots.map((slot) => ({ ...slot })), me: lootMe } };
    case "loot-empty": {
      const emptyMe = { ...lootMe, coins: 630, rank: 4 };
      return { ...withQuestion, screen: "LOOT_RESULT", me: emptyMe, answerResult: { ...answerResult, correct: true, starsGained: 120, me: emptyMe }, lootResult: { pickedSlot: 1, slots: [{ kind: "SMALL_WALLET", coins: 150 }, { kind: "EMPTY", coins: 0 }, { kind: "SCRAP", coins: 50 }], me: emptyMe } };
    }
    case "reconnect":
      return { ...withQuestion, connection: "reconnecting", attempt: 2, droppedAtMs: Date.now() - 5_000 };
    case "timeup":
      return { ...open, phase: "ENDING", me: { ...me, stars: 2330, coins: 1980 } };
    case "result":
      return { ...open, phase: "ENDED", screen: "ENDED", ended: { final, me: { ...final[2], weakQuestions: [{ questionId: "a", title: "Sắp xếp các bước nén thư mục", index: 6, wrongCount: 2 }, { questionId: "b", title: "Ghép phần mở rộng với ứng dụng", index: 14, wrongCount: 1 }] } } };
    default:
      return withQuestion;
  }
}

/** Dev-only entry used by the student game room page when the room id is "preview". */
export default function PreviewRoom() {
  const params = new URLSearchParams(window.location.search);
  const state = stateFor(params.get("screen") ?? "question", params.get("kind") ?? "single_choice");
  return <HackRoomView state={state} room={room} send={() => true} retryNow={() => undefined} />;
}
