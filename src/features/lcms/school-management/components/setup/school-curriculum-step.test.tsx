import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { SchoolCurriculumStep } from "@/features/lcms/school-management/components/setup/school-curriculum-step";
import { ApiClientError } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (importOriginal) => ({ ...(await importOriginal<object>()), apiRequest }));

const school = {
  id: "s1", code: "A", name: "Trường A", academicYear: "2026-2027", schoolType: "secondary", students: [],
  classes: [{ id: "8A", name: "8A", studentCount: 0 }, { id: "8B", name: "8B", studentCount: 0 }],
  subjects: [{ id: "ic3", name: "IC3 Digital Literacy", code: "ic3", studentCount: 0, teacherCount: 0 }],
};
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => ({ enrollStudentsInClass: vi.fn(), selectedSchool: school }),
}));

const tree = {
  subjects: [{
    subject: { id: "ic3", code: "ic3", name: "IC3 Digital Literacy" },
    levels: [{ level: { id: "l1", name: "Level 1", sortOrder: 1 } }, { level: { id: "l3", name: "Level 3", sortOrder: 3 } }],
  }],
};
const saved = { schoolId: "s1", academicYear: "2026-2027", version: 4, allocations: [{ classId: "8B", subjectIds: ["ic3"], levelIds: { ic3: "l3" } }] };

function renderStep() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><SchoolCurriculumStep /></QueryClientProvider>);
}

beforeEach(() => {
  apiRequest.mockReset();
  apiRequest.mockImplementation(async (url: string) => (url.startsWith(API_ENDPOINTS.curriculum.activeTree) ? tree : saved));
});

it("shows the level per class next to the subject", async () => {
  renderStep();
  expect(await screen.findByText("8B (0) · Level 3")).toBeTruthy();
  expect(screen.getByText("IC3 Digital Literacy · Level 3")).toBeTruthy();
});

it("allocates the KCT subject with its level and keeps the level stored for another class", async () => {
  renderStep();
  await screen.findByText("8B (0) · Level 3");
  fireEvent.click(screen.getByRole("tab", { name: "Theo lớp học" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Gán môn & level" })[0]);
  fireEvent.click(await screen.findByRole("button", { name: "Xác nhận môn học & lớp" }));

  await waitFor(() => expect(apiRequest.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(true));
  const put = apiRequest.mock.calls.find(([, init]) => init?.method === "PUT")!;
  expect(JSON.parse(put[1].body)).toEqual({
    expectedVersion: 4,
    allocations: [
      { classId: "8A", subjectIds: ["ic3"], levelIds: { ic3: "l1" } },
      { classId: "8B", subjectIds: ["ic3"], levelIds: { ic3: "l3" } },
    ],
  });
});

it("shows a load error with retry instead of a local subject list when the catalog fails", async () => {
  apiRequest.mockImplementation(async (url: string) => {
    if (url.startsWith(API_ENDPOINTS.curriculum.activeTree)) throw new Error("down");
    return saved;
  });
  renderStep();
  const add = await screen.findByRole("button", { name: /^Thêm .* & level$/ });
  await waitFor(() => expect(add.hasAttribute("disabled")).toBe(false));
  fireEvent.click(add);
  expect(await screen.findByText(/Không tải được danh mục môn học và level/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Xác nhận môn học & lớp" }).hasAttribute("disabled")).toBe(true);
  const before = apiRequest.mock.calls.length;
  fireEvent.click(screen.getAllByRole("button", { name: "Tải lại" }).at(-1)!);
  await waitFor(() => expect(apiRequest.mock.calls.length).toBeGreaterThan(before));
});

const twoClasses = {
  ...saved,
  allocations: [
    { classId: "8A", subjectIds: ["ic3"], levelIds: { ic3: "l1" } },
    { classId: "8B", subjectIds: ["ic3"], levelIds: { ic3: "l3" } },
  ],
};

function serve(putError?: Error) {
  apiRequest.mockImplementation(async (url: string, init?: { method?: string }) => {
    if (url.startsWith(API_ENDPOINTS.curriculum.activeTree)) return tree;
    if (init?.method === "PUT" && putError) throw putError;
    return twoClasses;
  });
}
const puts = () => apiRequest.mock.calls.filter(([, init]) => init?.method === "PUT");
const removeLabel = "Gỡ IC3 Digital Literacy khỏi lớp 8A";

async function openByClass() {
  renderStep();
  fireEvent.click(await screen.findByRole("tab", { name: "Theo lớp học" }));
  return screen.findByLabelText(removeLabel);
}

it("asks before removing a subject from one class, then sends the remaining set", async () => {
  serve();
  fireEvent.click(await openByClass());
  expect(await screen.findByText(/Gỡ môn IC3 Digital Literacy khỏi lớp 8A\? Nếu môn còn lịch dạy, sổ báo giảng hoặc công tiết trong vòng 1 tháng thì chưa gỡ được\./)).toBeTruthy();
  expect(puts()).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Gỡ môn" }));
  await waitFor(() => expect(puts()).toHaveLength(1));
  expect(JSON.parse(puts()[0][1].body)).toEqual({
    expectedVersion: 4,
    allocations: [{ classId: "8B", subjectIds: ["ic3"], levelIds: { ic3: "l3" } }],
  });
});

it("does not save when the removal is cancelled", async () => {
  serve();
  fireEvent.click(await openByClass());
  fireEvent.click(await screen.findByRole("button", { name: "Huỷ" }));
  await waitFor(() => expect(screen.queryByText(/Gỡ môn IC3/)).toBeNull());
  expect(puts()).toHaveLength(0);
});

it("removes a subject from the whole school", async () => {
  serve();
  renderStep();
  const remove = await screen.findByRole("button", { name: "Gỡ khỏi trường" });
  await waitFor(() => expect(remove.hasAttribute("disabled")).toBe(false));
  fireEvent.click(remove);
  expect(await screen.findByText(/Gỡ môn IC3 Digital Literacy khỏi trường Trường A\? Môn sẽ bị gỡ khỏi 2 lớp\./)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Gỡ môn" }));
  await waitFor(() => expect(puts()).toHaveLength(1));
  expect(JSON.parse(puts()[0][1].body)).toEqual({ expectedVersion: 4, allocations: [] });
});

it("tells the user in Vietnamese when someone else changed the allocation (409)", async () => {
  serve(new ApiClientError("conflict", "HTTP_409", 409));
  fireEvent.click(await openByClass());
  fireEvent.click(await screen.findByRole("button", { name: "Gỡ môn" }));
  expect(await screen.findByText("Phân môn vừa được người khác thay đổi. Tải lại rồi thử lại.")).toBeTruthy();
});
