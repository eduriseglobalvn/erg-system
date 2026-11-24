import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { SchoolInformationStep, type SchoolStepLeaveGuard } from "@/features/lcms/school-management/components/setup/school-information-step";

const saveSchool = vi.fn(async () => "s1");
const school = {
  id: "s1", name: "Trường A", address: "", district: "", principal: "", contactPhone: "", contactEmail: "",
  academicYear: "2026–2027", schoolType: "primary", status: "active", classes: [], students: [],
};

vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => ({ saveSchool, selectedSchool: school }),
}));

beforeEach(() => saveSchool.mockClear());

function renderStep() {
  const guard: { current: SchoolStepLeaveGuard | null } = { current: null };
  render(<SchoolInformationStep onLeaveGuard={(next) => { guard.current = next; }} />);
  return guard;
}

it("leaves freely when nothing changed", () => {
  const guard = renderStep();
  expect(guard.current).toBeNull();
  expect(screen.queryByRole("button", { name: "Lưu thông tin" })).toBeNull();
});

it("asks before leaving with changes and saves on confirm", async () => {
  const guard = renderStep();
  fireEvent.change(screen.getByLabelText(/Địa chỉ/), { target: { value: "1 Lê Lợi" } });
  const go = vi.fn();
  guard.current!(go);
  fireEvent.click(await screen.findByRole("button", { name: "Xác nhận lưu" }));
  await waitFor(() => expect(go).toHaveBeenCalled());
  expect(saveSchool).toHaveBeenCalledWith(expect.objectContaining({ address: "1 Lê Lợi" }), "s1");
});

it("undoes the changes on cancel and still moves on", async () => {
  const guard = renderStep();
  fireEvent.change(screen.getByLabelText(/Địa chỉ/), { target: { value: "1 Lê Lợi" } });
  const go = vi.fn();
  guard.current!(go);
  fireEvent.click(await screen.findByRole("button", { name: "Hủy bỏ" }));
  expect(go).toHaveBeenCalled();
  expect(saveSchool).not.toHaveBeenCalled();
  expect((screen.getByLabelText(/Địa chỉ/) as HTMLInputElement).value).toBe("");
});

it("cannot save a blank school name", async () => {
  const guard = renderStep();
  fireEvent.change(screen.getByLabelText(/Tên trường/), { target: { value: "  " } });
  guard.current!(vi.fn());
  expect((await screen.findByRole("button", { name: "Xác nhận lưu" }) as HTMLButtonElement).disabled).toBe(true);
});
