import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuestionTable } from "./question-table";
import type { QuestionListRow } from "./question-table-row";

const choice = (id: string, label: string, correct = false) => ({ id, label, correct });
const ready: QuizEditorSlide = { id: "s1", title: "2 + 2 = ?", kind: "multiple-choice", status: "draft", choices: [choice("a", "4", true), choice("b", "5")] };
const missing: QuizEditorSlide = { id: "s2", title: "", kind: "matching", status: "unsaved" };
const topic = (id: string, label: string): TopicRow => ({ id, label, quizId: `q-${id}`, questionCount: 1, lifecycle: "draft", slides: [] });

const topicRows: QuestionListRow[] = [
  { slide: ready, number: 1, groupId: "g1", topic: null, onServer: true },
  { slide: missing, number: 2, groupId: "g1", topic: null, onServer: false },
];

function renderTable(props: Partial<Parameters<typeof QuestionTable>[0]> = {}) {
  const handlers = { onAdd: vi.fn(), onOpenRow: vi.fn() };
  render(
    <I18nProvider>
      <QuestionTable rows={topicRows} topicLabel="Phân số" {...handlers} {...props} />
    </I18nProvider>,
  );
  return handlers;
}

const bodyRows = () => screen.getAllByRole("row").slice(1);

describe("QuestionTable", () => {
  it("shows #, question, type, readiness and the cloud, with no topic column or checkboxes", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["#", "Câu hỏi", "Dạng", "Mức sẵn sàng", "Máy chủ"]);
    const [first, second] = bodyRows();
    expect(within(first!).getByText("2 + 2 = ?")).toBeInTheDocument();
    expect(within(first!).getByText("Một đáp án")).toBeInTheDocument();
    expect(within(first!).getByText("Sẵn sàng")).toBeInTheDocument();
    expect(within(first!).getByTitle("Đã lên máy chủ")).toBeInTheDocument();
    expect(within(second!).getByText("Ghép cặp")).toBeInTheDocument();
    expect(within(second!).getByText(/^Chưa có đề bài/)).toBeInTheDocument();
    expect(within(second!).getByTitle("Chưa lên máy chủ")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("filters to the questions still missing something, and by title", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Còn thiếu" }));
    expect(bodyRows()).toHaveLength(1);
    expect(within(bodyRows()[0]!).getByText("Ghép cặp")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm câu hỏi" }), { target: { value: "2 + 2" } });
    expect(bodyRows()).toHaveLength(1);
    expect(within(bodyRows()[0]!).getByText("2 + 2 = ?")).toBeInTheDocument();
  });

  it("names the topic on the add button and opens the editor from a row", () => {
    const { onAdd, onOpenRow } = renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Thêm câu hỏi vào “Phân số”" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("2 + 2 = ?"));
    expect(onOpenRow).toHaveBeenCalledWith(topicRows[0]);
    // A focusable row says what Enter does.
    expect(screen.getByRole("row", { name: "Mở câu 2: (Chưa có đề bài)" })).toHaveAttribute("tabindex", "0");
  });

  it("in Tất cả shows each row's own topic and the hint instead of the add button", () => {
    const rows: QuestionListRow[] = [
      { slide: ready, number: 1, groupId: null, topic: topic("t1", "Phân số"), onServer: true },
      { slide: { ...ready, id: "s9", title: "Tam giác" }, number: 1, groupId: null, topic: topic("t2", "Hình học"), onServer: true },
    ];
    const { onOpenRow } = renderTable({ rows, topicLabel: null });
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["#", "Câu hỏi", "Chủ đề", "Dạng", "Mức sẵn sàng", "Máy chủ"]);
    expect(within(bodyRows()[1]!).getByText("Hình học")).toBeInTheDocument();
    expect(screen.getByText("Chọn một chủ đề để thêm câu hỏi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thêm câu hỏi/ })).toBeNull();
    fireEvent.click(screen.getByText("Tam giác"));
    expect(onOpenRow).toHaveBeenCalledWith(rows[1]);
  });

  it("in Tất cả, two quizzes may hold the same slide id: both rows show, with no key clash", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const rows: QuestionListRow[] = [
      { slide: ready, number: 1, groupId: null, topic: topic("t1", "Phân số"), onServer: true },
      { slide: { ...ready, title: "Tam giác" }, number: 1, groupId: null, topic: topic("t2", "Hình học"), onServer: true },
    ];
    renderTable({ rows, topicLabel: null });
    expect(bodyRows()).toHaveLength(2);
    expect(errors.mock.calls.flat().join(" ")).not.toMatch(/same key/);
    errors.mockRestore();
  });

  it("a topic with no quiz yet: empty table, still with the add button", () => {
    renderTable({ rows: [], topicLabel: "Hình học" });
    expect(bodyRows()).toHaveLength(0);
    expect(screen.getByText("Chưa có câu hỏi nào.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm câu hỏi vào “Hình học”" })).toBeInTheDocument();
  });
});
