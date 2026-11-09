import { beforeEach, expect, test, vi } from "vitest";

import { bulkCreateStudentAccounts } from "@/features/lcms/admin-operations/api/student-account-import-api";
import { apiRequest } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({ apiRequest: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

beforeEach(() => {
  apiRequestMock.mockReset();
  apiRequestMock.mockResolvedValue({ requested: 2, created: 2, replayed: 0 });
});

const row = (rowNumber: number, className: string) => ({
  rowId: `r${rowNumber}`,
  rowNumber,
  included: true,
  fullName: `Học sinh ${rowNumber}`,
  className,
  username: `hs${rowNumber}.7a1`,
  password: "123456",
});

test("imports the rows through the school endpoint with a password so the accounts are created too", async () => {
  const result = await bulkCreateStudentAccounts({
    centerId: "school-12345678-abc",
    classIdsByName: { "7a1": "class-1" },
    rows: [row(1, "7A1"), { ...row(2, "7A2"), included: false }, row(3, "7B")],
  });

  const [path, init] = apiRequestMock.mock.calls[0]!;
  expect(path).toBe("/api/v1/lcms/schools/school-12345678-abc/students/import");
  const items = JSON.parse(String(init?.body)).items as Array<Record<string, unknown>>;
  expect(items).toHaveLength(2);
  expect(items[0]).toMatchObject({
    studentCode: "SCHOOL-1-7A1-1",
    username: "hs1.7a1",
    password: "123456",
    academicClassId: "class-1",
  });
  expect(items[1]).not.toHaveProperty("academicClassId");
  expect(result).toMatchObject({ created: 2, skipped: 0, duplicates: 0 });
  expect(result.credentials.map((item) => item.username)).toEqual(["hs1.7a1", "hs3.7a1"]);
});

test("a fixed target class wins over the class name in the sheet", async () => {
  await bulkCreateStudentAccounts({
    centerId: "school-1",
    classId: "target",
    classIdsByName: { "7a1": "class-1" },
    rows: [row(1, "7A1")],
  });

  const items = JSON.parse(String(apiRequestMock.mock.calls[0]![1]?.body)).items as Array<Record<string, unknown>>;
  expect(items[0]!.academicClassId).toBe("target");
});
