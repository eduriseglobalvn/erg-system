import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublishBlockedPopover } from "./publish-blocked-popover";

const notReady = [
  // A title of spaces is blank too, written the same way as in the table and the editor rail.
  { slideId: "s2", number: 2, title: "   ", label: "Chưa có đề bài" },
  { slideId: "s5", number: 5, title: "2 + 2 = ?", label: "Chưa có đáp án đúng" },
];

describe("PublishBlockedPopover", () => {
  it("titles the list with the count and names each question with what is missing", () => {
    render(<PublishBlockedPopover anchorEl={document.body} notReady={notReady} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByText("Còn 2 câu chưa sẵn sàng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 2: (Chưa có đề bài) — Chưa có đề bài" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 5: 2 + 2 = ? — Chưa có đáp án đúng" })).toBeInTheDocument();
  });

  it("passes the clicked question to onSelect", () => {
    const onSelect = vi.fn();
    render(<PublishBlockedPopover anchorEl={document.body} notReady={notReady} onClose={vi.fn()} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Câu 5/ }));
    expect(onSelect).toHaveBeenCalledWith("s5");
  });

  it("renders nothing without an anchor", () => {
    render(<PublishBlockedPopover anchorEl={null} notReady={notReady} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.queryByText("Còn 2 câu chưa sẵn sàng")).toBeNull();
  });
});
