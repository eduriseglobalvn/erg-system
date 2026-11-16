import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { DraftCard, draftIssueLine } from "./draft-card";

const draft = (conflicts: Array<{ kind: string; severity?: string }>) => ({
  batch: { id: "b1", label: "Đợt 2", schoolId: "s1" },
  conflicts,
}) as never;

it("draftIssueLine names a single kind and generalizes mixed kinds", () => {
  expect(draftIssueLine([])).toBe("");
  expect(draftIssueLine([{ kind: "TEACHER_TIME" }, { kind: "TEACHER_TIME" }])).toBe("2 trùng giáo viên cần xử lý");
  expect(draftIssueLine([{ kind: "ROOM_TIME" }])).toBe("1 trùng phòng cần xử lý");
  expect(draftIssueLine([{ kind: "ROOM_TIME" }, { kind: "CLASS_TIME" }, { kind: "TRAVEL_TIME" }])).toBe("3 xung đột cần xử lý");
});

it("DraftCard shows the issue line only when there are errors", () => {
  const { rerender } = render(<DraftCard draft={draft([{ kind: "TEACHER_TIME", severity: "ERROR" }])} events={[]} shortNames={new Map([["s1", "Trương Công Định"]])} />);
  expect(screen.getByText("1 trùng giáo viên cần xử lý")).toBeInTheDocument();
  expect(screen.getByText("Đợt 2")).toBeInTheDocument();
  rerender(<DraftCard draft={draft([])} events={[]} shortNames={new Map()} />);
  expect(screen.queryByText(/cần xử lý/)).toBeNull();
});
