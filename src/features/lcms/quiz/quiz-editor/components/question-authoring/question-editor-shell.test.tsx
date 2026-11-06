import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { buildPreviewQuestion } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-question-builders";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { slideFingerprint } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuestionEditorShell } from "./question-editor-shell";
import { readSlideQuestion, writeSlideQuestion } from "./slide-question";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));

const choice = (id: string, label: string, correct = false) => ({ id, label, correct });
const ready: QuizEditorSlide = {
  id: "s1",
  title: "2 + 2 = ?",
  kind: "multiple-choice",
  status: "published",
  choices: [choice("a", "4", true), choice("b", "5")],
};
const blank: QuizEditorSlide = {
  id: "s2",
  title: "",
  kind: "multiple-choice",
  options: { shuffleAnswers: true },
  choices: [choice("c", ""), choice("d", ""), choice("e", "")],
};
const third: QuizEditorSlide = { ...ready, id: "s3", title: "3 + 3 = ?" };
const groups: QuizEditorGroup[] = [
  { id: "g1", title: "Phân số", rule: "all", randomCount: 0, slides: [ready, blank] },
  { id: "g2", title: "Số thập phân", rule: "all", randomCount: 0, slides: [third] },
];

function renderShell(overrides: Partial<Parameters<typeof QuestionEditorShell>[0]> = {}) {
  const props = {
    groups,
    selectedSlide: blank,
    onSelectSlide: vi.fn(),
    onReplaceSlide: vi.fn(),
    onAddQuestion: vi.fn(),
    onChangeType: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
    syncChip: <span>sync-chip</span>,
    banner: null,
    quizProject: {},
    ...overrides,
  };
  render(
    <I18nProvider>
      <QuestionEditorShell {...props} />
    </I18nProvider>,
  );
  return props;
}

describe("QuestionEditorShell", () => {
  it("counts question slides across all groups in the title bar", () => {
    renderShell();
    expect(screen.getByText("Câu 2 / 3")).toBeInTheDocument();
  });

  it("shows the readiness chip and a missing rail dot for a blank multiple-choice slide", () => {
    renderShell();
    expect(screen.getByText("Chưa có đề bài · còn 3 chỗ khác")).toBeInTheDocument();
    const rail = screen.getByRole("navigation", { name: "Danh sách câu hỏi" });
    const row = within(rail).getByRole("button", { name: /\(Chưa có đề bài\)/ });
    expect(row.querySelector("[data-status]")?.getAttribute("data-status")).toBe("missing");
    expect(row.querySelector("[data-status]")?.getAttribute("aria-label")).toBe("Chưa có đề bài · còn 3 chỗ khác");
  });

  it("marks a published question edited since with the yellow dot and its label", () => {
    const edited = { ...ready, title: "2 + 2 = ? (sửa)" };
    renderShell({
      groups: [{ ...groups[0], slides: [edited, third] }],
      selectedSlide: edited,
      quizProject: { publishedFingerprints: { s1: slideFingerprint(ready), s3: slideFingerprint(third) } },
    });
    const rail = screen.getByRole("navigation", { name: "Danh sách câu hỏi" });
    const [editedDot, thirdDot] = Array.from(rail.querySelectorAll("[data-status]"));
    expect(editedDot?.getAttribute("data-status")).toBe("changed");
    expect(editedDot?.getAttribute("aria-label")).toBe("Có sửa chưa xuất bản");
    expect(thirdDot?.getAttribute("aria-label")).toBe("Sẵn sàng");
  });

  it.each([
    ["multiple-response", "Bấm ô chữ cái để đánh dấu các đáp án đúng"],
    ["true-false", "Bấm ô chữ cái để chọn đáp án đúng"],
  ] as const)("a %s card without a correct answer says how to mark one", (kind, hint) => {
    const slide: QuizEditorSlide = { ...ready, id: "s9", kind, choices: [choice("a", "Đúng"), choice("b", "Sai")] };
    renderShell({ groups: [{ ...groups[0], slides: [slide] }], selectedSlide: slide });
    expect(screen.getAllByRole("status").map((el) => el.textContent).join(" | ")).toContain(hint);
  });

  it("writes a typed title through onReplaceSlide and leaves options alone", () => {
    const onReplaceSlide = vi.fn();
    renderShell({ onReplaceSlide });
    fireEvent.change(screen.getByPlaceholderText("Nhập đề bài"), { target: { value: "1/2 + 1/2 = ?" } });
    const next = onReplaceSlide.mock.calls.at(-1)![0] as QuizEditorSlide;
    expect(next.title).toBe("1/2 + 1/2 = ?");
    expect(next.options).toBe(blank.options);
  });

  it("hides the rail and runs the quiz in learner view", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Học viên làm" }));
    expect(screen.queryByRole("navigation", { name: "Danh sách câu hỏi" })).toBeNull();
    expect(screen.getByText("Luyện tập")).toBeInTheDocument();
  });

  it("a new question offers both message buttons, and its try-run says \"Chính xác!\" once", () => {
    const fresh = buildQuestionSlide("multiple-choice", createNewQuizProjectSettings(), (prefix) => `${prefix}-new`);
    const authored: QuizEditorSlide = { ...fresh, title: "1 + 1 = ?", choices: [choice("x", "2", true), choice("y", "3")] };
    renderShell({ groups: [{ ...groups[0]!, slides: [authored] }], selectedSlide: authored });
    expect(screen.getByRole("button", { name: "+ Khi đúng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Khi sai" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Học viên làm" }));
    fireEvent.click(screen.getByText("2"));
    fireEvent.click(screen.getByRole("button", { name: "Xem kết quả" }));
    expect(screen.getByRole("status").textContent).toBe("Chính xác!");
  });

  it("reveals the correct-answer message box", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "+ Khi đúng" }));
    expect(screen.getByRole("textbox", { name: "Lời nhắn khi đúng" })).toBeInTheDocument();
  });

  it("offers exactly three actions in the more menu", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Thêm thao tác" }));
    const menu = screen.getByRole("menu", { name: "Thao tác câu hỏi" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
  });

  it("has exactly one contained button in author mode", () => {
    renderShell();
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("names the back button with its visible text", () => {
    renderShell();
    expect(screen.getByRole("button", { name: "Quay lại danh sách câu hỏi" })).toBeInTheDocument();
  });

  function deleteVia(selectedSlide: QuizEditorSlide, list = groups) {
    const props = renderShell({ selectedSlide, groups: list });
    fireEvent.click(screen.getByRole("button", { name: "Thêm thao tác" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Xoá câu hỏi" }));
    const confirm = screen.getByRole("dialog", { name: "Xoá câu hỏi này?" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá" }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
    return props;
  }

  it("selects the next question after deleting", () => {
    expect(deleteVia(blank).onSelectSlide).toHaveBeenCalledWith("g2", "s3");
  });

  it("selects the previous question after deleting the last one", () => {
    expect(deleteVia(third).onSelectSlide).toHaveBeenCalledWith("g1", "s2");
  });

  it("closes after deleting the only question", () => {
    const props = deleteVia(blank, [{ ...groups[0]!, slides: [blank] }]);
    expect(props.onSelectSlide).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Esc, but Esc in the open menu only closes the menu", () => {
    const { onClose } = renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Thêm thao tác" }));
    fireEvent.keyDown(screen.getByRole("menu", { name: "Thao tác câu hỏi" }), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Soạn câu hỏi" }), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("writes the correct-answer message into feedbackRows without changing the points", () => {
    const onReplaceSlide = vi.fn();
    renderShell({ onReplaceSlide });
    fireEvent.click(screen.getByRole("button", { name: "+ Khi đúng" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Lời nhắn khi đúng" }), { target: { value: "Giỏi lắm" } });
    const next = onReplaceSlide.mock.calls.at(-1)![0] as QuizEditorSlide;
    expect(next.feedbackRows?.find((row) => row.kind === "correct")?.feedback).toBe("Giỏi lắm");
    const t = ((key: string) => key) as never;
    expect(buildPreviewQuestion(next, t)?.points).toBe(buildPreviewQuestion(blank, t)?.points);
  });

  it("shows the sync banner inside the editor, above the card", () => {
    renderShell({ banner: <div>Mất kết nối</div> });
    const dialog = screen.getByRole("dialog", { name: "Soạn câu hỏi" });
    const banner = within(dialog).getByText("Mất kết nối");
    expect(banner.compareDocumentPosition(within(dialog).getByPlaceholderText("Nhập đề bài")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows an unconfirmed matching key once, in the warning that holds the confirm button", () => {
    const base = buildQuestionSlide("matching", createNewQuizProjectSettings(), (p) => `${p}-m`);
    const question = readSlideQuestion(base, ((key: string) => key) as never)!;
    const keyless = writeSlideQuestion({ ...base, title: "Nối" }, {
      ...question,
      title: "Nối",
      matching: [{ id: "p1", prompt: "A" }, { id: "p2", prompt: "B" }],
      matchingResponses: [{ id: "x", response: "one" }, { id: "y", response: "two" }],
    });
    renderShell({ groups: [{ ...groups[0]!, slides: [keyless] }], selectedSlide: keyless });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Chưa rõ cặp nào đúng. Ghép đúng các cặp rồi bấm “Các cặp đã đúng”.");
    expect(within(alert).getByRole("button", { name: "Các cặp đã đúng" })).toBeInTheDocument();
    for (const status of screen.queryAllByRole("status")) expect(status).not.toHaveTextContent("Chưa rõ cặp nào đúng");
  });
});

const intro: QuizEditorSlide = { id: "i1", title: "Chào mừng", kind: "intro-slide", instructions: ["Đọc kỹ đề"] };
const withIntro: QuizEditorGroup[] = [{ ...groups[0]!, slides: [intro, ready, blank] }, groups[1]!];

describe("QuestionEditorShell with intro slides", () => {
  it("leaves intro slides out of the count and the rail", () => {
    renderShell({ groups: withIntro });
    expect(screen.getByText("Câu 2 / 3")).toBeInTheDocument();
    const rail = screen.getByRole("navigation", { name: "Danh sách câu hỏi" });
    expect(within(rail).queryByText("Chào mừng")).toBeNull();
  });
});

describe("QuestionEditorShell images added while the teacher keeps typing", () => {
  let latest: QuizEditorSlide = ready;
  function Stateful({ initial }: { initial: QuizEditorSlide }) {
    const [slide, setSlide] = useState(initial);
    latest = slide;
    return (
      <I18nProvider>
        <QuestionEditorShell
          {...{ onSelectSlide: vi.fn(), onAddQuestion: vi.fn(), onChangeType: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() }}
          banner={null}
          groups={[{ ...groups[0]!, slides: [slide] }]}
          onReplaceSlide={(update) => setSlide((current) => (typeof update === "function" ? update(current) : update))}
          quizProject={{}}
          selectedSlide={slide}
          syncChip={null}
        />
      </I18nProvider>
    );
  }
  const pending = () => {
    let resolve!: (value: unknown) => void;
    prepare.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    return (dataUrl: string) => act(async () => resolve({ dataUrl, width: 4, height: 3 }));
  };
  const file = new File(["x"], "a.png", { type: "image/png" });

  it("keeps a title typed while an option image is processed", async () => {
    render(<Stateful initial={ready} />);
    const finish = pending();
    fireEvent.change(screen.getByLabelText("Ảnh phương án 1"), { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("Nhập đề bài"), { target: { value: "Mới" } });
    await finish("data:image/png;base64,AAAA");
    await waitFor(() => expect(latest.choices?.[0].media?.src).toBe("data:image/png;base64,AAAA"));
    expect(latest.title).toBe("Mới");
  });

  it("keeps a title typed while the question image is processed", async () => {
    render(<Stateful initial={ready} />);
    const finish = pending();
    const input = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]')).find((el) => !el.getAttribute("aria-label"))!;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("Nhập đề bài"), { target: { value: "Mới" } });
    await finish("data:image/png;base64,BBBB");
    await waitFor(() => expect(latest.media?.src).toBe("data:image/png;base64,BBBB"));
    expect(latest.title).toBe("Mới");
  });
});
