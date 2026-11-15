import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { TeacherPick } from "./teacher-pick";

const teacher = (id: string, name: string, extra: object = {}) => ({
  classAccess: "NEW", initials: name.slice(0, 2), state: "FREE", taughtHereLastWeek: false, teacherId: id, teacherName: name, weeklyPeriods: 10, ...extra,
});
const TEACHERS = [teacher("t1", "T.Tuấn"), teacher("t2", "Q.Vương", { classAccess: "HAS" }), teacher("t3", "H.Lan", { busy: { className: "8A1", schoolName: "LQĐ" }, state: "BUSY" })] as never;

it("assistant mode lists «Không có trợ giảng», disables the main teacher and picks null", () => {
  const onSelect = vi.fn();
  render(<TeacherPick className="9A1" mainTeacher={{ id: "t1", name: "T.Tuấn" }} mode="assistant" onClose={vi.fn()} onSelect={onSelect} teachers={TEACHERS} />);
  expect(screen.getByPlaceholderText("Tìm trợ giảng…")).toBeInTheDocument();
  expect(screen.getByText("Đang là GV chính")).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /T\.Tuấn/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("option", { name: /Không có trợ giảng/ }));
  expect(onSelect).toHaveBeenCalledWith(null);
});

it("assistant mode picks a free teacher; teacher mode has no «Không có trợ giảng»", () => {
  const onSelect = vi.fn();
  const { unmount } = render(<TeacherPick className="9A1" mainTeacher={{ id: "t1" }} mode="assistant" onClose={vi.fn()} onSelect={onSelect} teachers={TEACHERS} />);
  fireEvent.click(screen.getByRole("option", { name: /Q\.Vương/ }));
  expect(onSelect).toHaveBeenCalledWith({ id: "t2", name: "Q.Vương" });
  unmount();
  render(<TeacherPick className="9A1" onClose={vi.fn()} onSelect={vi.fn()} teachers={TEACHERS} />);
  expect(screen.queryByText("Không có trợ giảng")).toBeNull();
  expect(screen.getByPlaceholderText("Tìm giáo viên…")).toBeInTheDocument();
});
