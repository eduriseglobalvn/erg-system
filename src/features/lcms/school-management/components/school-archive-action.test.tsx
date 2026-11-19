import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const context = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => context.value,
}));

import { SchoolArchiveAction } from "./school-archive-action";

const archiveSchool = vi.fn(() => Promise.resolve());
const restoreSchool = vi.fn(() => Promise.resolve());

beforeEach(() => {
  archiveSchool.mockClear();
  restoreSchool.mockClear();
  context.value = { archiveSchool, isSaving: false, restoreSchool, selectedSchool: { id: "s1", name: "THCS Nguyễn Du", status: "active" } };
});

it("archives only after the confirm dialog that names the school", async () => {
  render(<SchoolArchiveAction />);

  fireEvent.click(screen.getByRole("button", { name: "Lưu trữ trường" }));
  expect(screen.getByRole("dialog", { name: "Lưu trữ THCS Nguyễn Du?" })).toHaveTextContent("Dữ liệu lớp, học sinh và lịch sử vẫn được giữ");
  expect(archiveSchool).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Lưu trữ" }));
  await waitFor(() => expect(archiveSchool).toHaveBeenCalledWith("s1"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("offers restore for an archived school", () => {
  context.value = { ...context.value, selectedSchool: { id: "s1", name: "THCS Nguyễn Du", status: "archived" } };
  render(<SchoolArchiveAction />);

  expect(screen.queryByRole("button", { name: "Lưu trữ trường" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Khôi phục trường" }));
  expect(restoreSchool).toHaveBeenCalledWith("s1");
});
