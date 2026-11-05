import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { EssayAuthoring } from "./essay-authoring";
import { assessQuestionReadiness, readinessLabel } from "./question-readiness";

const base = (essayRubric: NonNullable<Question["essayRubric"]> = []): Question =>
  ({ id: "q", kind: "essay", title: "Nêu các loại địa chỉ ô", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, essayRubric }) as Question;

let latest: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  return <EssayAuthoring onChange={setQ} onUpdate={(change) => setQ((l) => change(l))} question={q} />;
}

const rubric = () => latest.essayRubric!.map(({ label, points }) => ({ label, points }));

describe("EssayAuthoring", () => {
  it("shows the caption and a static preview box", () => {
    render(<Harness start={base()} />);
    expect(screen.getByText("Gợi ý chấm cho giáo viên (học viên không thấy)")).toBeInTheDocument();
    expect(screen.getByText("Học viên viết bài ở đây…")).toHaveAttribute("aria-hidden", "true");
  });

  it("adds a criterion with zero points and removes it", () => {
    render(<Harness start={base()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm tiêu chí" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tiêu chí 1" }), { target: { value: "Nêu đủ 3 loại địa chỉ ô" } });
    expect(rubric()).toEqual([{ label: "Nêu đủ 3 loại địa chỉ ô", points: 0 }]);
    fireEvent.click(screen.getByRole("button", { name: "Xoá tiêu chí 1" }));
    expect(latest.essayRubric).toEqual([]);
  });

  it("keeps an old points value when the label is edited", () => {
    render(<Harness start={base([{ id: "c1", label: "Ví dụ", points: 3 }])} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tiêu chí 1" }), { target: { value: "Ví dụ đúng" } });
    expect(rubric()).toEqual([{ label: "Ví dụ đúng", points: 3 }]);
  });

  it("Enter adds a criterion, but not while composing", () => {
    render(<Harness start={base([{ id: "c1", label: "Một", points: 0 }])} />);
    const input = screen.getByRole("textbox", { name: "Tiêu chí 1" });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(latest.essayRubric).toHaveLength(1);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(latest.essayRubric).toHaveLength(2);
  });

  it("a titled essay with a blank criterion is ready", () => {
    expect(readinessLabel(assessQuestionReadiness(base([{ id: "c", label: "", points: 0 }]), { hasQuestionImage: false }))).toBe("Sẵn sàng");
  });
});

describe("EssayAuthoring focus", () => {
  it("focuses the add button after the last criterion is deleted", async () => {
    render(<Harness start={base([{ id: "c1", label: "Một", points: 0 }])} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá tiêu chí 1" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Thêm tiêu chí" })).toHaveFocus());
  });
});
