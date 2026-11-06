import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";

import type { RecipientCard } from "../api/campaign-types";
import { type AudienceDraft, emptyDraft } from "../model/audience-draft";
import { RecipientsSheet } from "./recipients-sheet";

// Fixture: 126 people = 98 students (7A: 50, 7B: 48) + 4 teachers + 24 staff, plus 2 unmatched pasted lines.
const people = (n: number, role: string, label: string, klass: string): RecipientCard[] =>
  Array.from({ length: n }, (_, i) => ({
    userId: `${role}-${klass}-${i}`, displayName: `${label} ${klass} ${i}`, role, meta: `${label} · ${klass} · X${i}`,
  }));

const draft: AudienceDraft = {
  ...emptyDraft("PEOPLE"),
  picked: [
    ...people(50, "STUDENT", "Học sinh", "7A"),
    ...people(48, "STUDENT", "Học sinh", "7B"),
    ...people(4, "TEACHER", "Giáo viên", "Toán"),
    ...people(24, "STAFF", "Nhân viên", "VP"),
  ],
  errors: ["HS9999", "Nguyễn Văn A"],
};

function Harness() {
  const [value, setValue] = useState(draft);
  return <RecipientsSheet draft={value} onChange={setValue} onClose={() => undefined} open />;
}

test("filter chips count everyone, without a parent chip", () => {
  render(<Harness />);
  for (const name of ["Tất cả 126", "HS 98", "GV 4", "Lỗi 2"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /PH/ })).toBeNull();
  expect(screen.getByRole("button", { name: "Tất cả 126" })).toHaveAttribute("aria-pressed", "true");
});

test("groups by class show 5 people and expand with 'Xem thêm'", () => {
  render(<Harness />);
  const group = screen.getByRole("region", { name: /7A/ });
  expect(within(group).getAllByRole("listitem")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Xem thêm 45 người của 7A" }));
  expect(within(screen.getByRole("region", { name: /7A/ })).getAllByRole("listitem")).toHaveLength(50);
});

test("filtering by HS hides teachers and staff", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "HS 98" }));
  expect(screen.queryByRole("region", { name: /Giáo viên/ })).toBeNull();
  expect(screen.getByRole("region", { name: /7B/ })).toBeInTheDocument();
});

test("'Bỏ 2 dòng' clears the errors and the chip disappears", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Bỏ 2 dòng" }));
  expect(screen.queryByRole("button", { name: /Lỗi/ })).toBeNull();
  expect(screen.queryByText("HS9999")).toBeNull();
});

test("'Bỏ cả lớp' removes a class and the final button follows the total", () => {
  render(<Harness />);
  expect(screen.getByRole("button", { name: "Xong · 126 người" })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("region", { name: /7A/ })).getByRole("button", { name: "Bỏ cả lớp" }));
  expect(screen.getByRole("button", { name: "Xong · 76 người" })).toBeInTheDocument();
});
