import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { useQuestionExcelImport } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import-dialog";
import { QUESTION_TEMPLATE_EXAMPLES, QUESTION_TEMPLATE_HEADERS } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";

const moveQuestionsToTopic = vi.hoisted(() => vi.fn());
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic", () => ({ moveQuestionsToTopic }));

const topics = [{ id: "t1", label: "Phân số" }];

let next = 0;

function Harness({ onImport }: { onImport: (questions: unknown[]) => void }) {
  const { openImport, dialog } = useQuestionExcelImport({
    topicLabel: null,
    topics,
    subjectId: "s1",
    levelId: "l1",
    labels: { subject: "Toán", level: "Level 1" },
    createId: (prefix) => `${prefix}-${(next += 1)}`,
    questionDefaults: createNewQuizProjectSettings().questionDefaults,
    onImport,
  });
  return (
    <>
      <button type="button" onClick={openImport}>open-import</button>
      {dialog}
    </>
  );
}

function workbook(sheets: Record<string, string[][]>) {
  const book = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([[...QUESTION_TEMPLATE_HEADERS], ...rows]), name);
  const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const file = new File([bytes], "cau-hoi.xlsx");
  // jsdom's File has no arrayBuffer().
  Object.defineProperty(file, "arrayBuffer", { value: () => Promise.resolve(bytes) });
  return file;
}

describe("useQuestionExcelImport in Tất cả", () => {
  it("saves a topic's sheet to that topic and puts a sheet that matches no topic into Tất cả", async () => {
    moveQuestionsToTopic.mockResolvedValue(undefined);
    const onImport = vi.fn();
    render(<QueryClientProvider client={new QueryClient()}><Harness onImport={onImport} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "open-import" }));

    const [first, second] = QUESTION_TEMPLATE_EXAMPLES;
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    fireEvent.change(input, { target: { files: [workbook({ "Phân số": [first!], "Chưa có chủ đề": [second!], "Ôn tập": [first!], "Ví dụ": [first!] })] } });

    fireEvent.click(await screen.findByRole("button", { name: "Nhập 3 câu" }));
    expect(screen.getByText(/“Ôn tập” không trùng tên chủ đề nào/)).toBeInTheDocument();
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(moveQuestionsToTopic).toHaveBeenCalledTimes(1);
    expect(moveQuestionsToTopic.mock.lastCall?.[1]).toMatchObject({ topicId: "t1" });
    // Excel rows are not bank rows: no bank link, so publishing mirrors them into the bank.
    expect(moveQuestionsToTopic.mock.lastCall?.[2][0]).not.toHaveProperty("bankQuestionId");
    expect(onImport.mock.lastCall?.[0]).toHaveLength(2);
  });
});
