import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { LikertQuestion } from "@/components/quiz/questions/likert-question";
import type { Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const labels = ["Rất không đồng ý", "Không đồng ý", "Trung lập", "Đồng ý", "Rất đồng ý"];
const question: Question = {
  id: "q-likert",
  kind: "likert_scale",
  title: "Khảo sát",
  points: 0,
  feedback: { correct: "", incorrect: "", partial: "" },
  likertRows: [{ id: "r-1", label: "Bài giảng dễ hiểu" }],
  likertScale: labels.map((label, index) => ({ id: `s-${index}`, label, value: index + 1 })),
};

describe("LikertQuestion", () => {
  test("shows only the authored labels and emits the chosen scale point", () => {
    const onChange = vi.fn();
    render(<LikertQuestion question={question} value={{}} onChange={onChange} />);

    // The scale ends are written under the row; every point keeps its label as the button name.
    for (const label of [labels[0], labels[4], "Bài giảng dễ hiểu"]) expect(screen.getByText(label)).toBeTruthy();
    for (const label of labels) expect(screen.getByRole("radio", { name: `Bài giảng dễ hiểu: ${label}` })).toBeTruthy();
    expect(screen.queryByText(/Criteria|Level \d/)).toBeNull();

    fireEvent.click(screen.getByLabelText("Bài giảng dễ hiểu: Đồng ý"));
    expect(onChange).toHaveBeenCalledWith({ likertResponses: { "r-1": "s-3" } });
  });
});
