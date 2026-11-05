import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuizListTitlebar } from "./quiz-list-titlebar";

const notReady = [{ slideId: "s2", number: 2, title: "", label: "Chưa có đề bài" }];

function renderBar(props: Partial<Parameters<typeof QuizListTitlebar>[0]> = {}) {
  const handlers = { onPublish: vi.fn(), onOpenQuestion: vi.fn(), onDismissPublishFailure: vi.fn() };
  render(
    <QuizListTitlebar
      courseOptions={[]}
      levelOptions={[]}
      notReady={[]}
      onChangeCourse={vi.fn()}
      onChangeLevel={vi.fn()}
      onOpenTheme={vi.fn()}
      publishBlockedReason={null}
      publishFailure={null}
      publishReadinessOnly={false}
      isPublishing={false}
      selectedCourseId=""
      selectedLevelId={null}
      syncChip={null}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("QuizListTitlebar publish", () => {
  it("publishes when nothing blocks it", () => {
    const { onPublish } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Xuất bản" }));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("keeps the button clickable when only readiness blocks it: the popover lists the questions and opens one", async () => {
    const { onPublish, onOpenQuestion } = renderBar({ notReady, publishBlockedReason: "Còn 1 câu chưa sẵn sàng", publishReadinessOnly: true });
    const button = screen.getByRole("button", { name: "Xuất bản" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(onPublish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Câu 2: (chưa có đề bài) — Chưa có đề bài" }));

    expect(onOpenQuestion).toHaveBeenCalledWith("s2");
    await waitFor(() => expect(screen.queryByText("Còn 1 câu chưa sẵn sàng")).toBeNull());
  });

  it("disables the button for offline, with the reason as its tooltip", async () => {
    renderBar({ publishBlockedReason: "Cần có mạng để xuất bản." });
    const button = screen.getByRole("button", { name: "Xuất bản" });
    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement!);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Cần có mạng để xuất bản.");
  });

  it("shows the server's reason and its detail lines under the bar, until dismissed", () => {
    const { onDismissPublishFailure } = renderBar({ publishFailure: { message: "Không xuất bản được", items: ["Câu 2 thiếu đáp án", "Câu 3 thiếu đề bài"] } });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Không xuất bản được");
    expect(alert).toHaveTextContent("Câu 2 thiếu đáp án");
    expect(alert).toHaveTextContent("Câu 3 thiếu đề bài");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismissPublishFailure).toHaveBeenCalledTimes(1);
  });
});
