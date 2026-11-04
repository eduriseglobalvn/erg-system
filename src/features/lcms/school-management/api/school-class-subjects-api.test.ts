import { beforeEach, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import { loadSchoolClassSubjects, saveSchoolClassSubjects } from "./school-class-subjects-api";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (importOriginal) => ({ ...(await importOriginal<object>()), apiRequest }));

beforeEach(() => apiRequest.mockReset());

it("loads the saved set for one school and academic year", async () => {
  apiRequest.mockResolvedValue({ schoolId: "s1", academicYear: "2026-2027", version: 0, allocations: [] });
  await loadSchoolClassSubjects({ schoolId: "s1", academicYear: "2026-2027" });
  expect(apiRequest).toHaveBeenCalledWith(
    "/api/v1/curriculum/class-subjects?schoolId=s1&academicYear=2026-2027",
    { signal: undefined },
  );
});

it("replaces the whole set and sends the version it was based on", async () => {
  apiRequest.mockResolvedValue({});
  const allocations = [{ classId: "c1", subjectIds: ["math"] }];
  await saveSchoolClassSubjects({ schoolId: "s1", academicYear: "2026-2027" }, { allocations, expectedVersion: 2 });
  expect(apiRequest).toHaveBeenCalledWith(
    "/api/v1/curriculum/class-subjects?schoolId=s1&academicYear=2026-2027",
    { method: "PUT", body: JSON.stringify({ allocations, expectedVersion: 2 }) },
  );
});

it("treats a backend without the endpoint (404) as nothing saved, but rethrows other errors", async () => {
  apiRequest.mockRejectedValueOnce(new ApiClientError("nf", "HTTP_404", 404));
  await expect(loadSchoolClassSubjects({ schoolId: "s1", academicYear: "2026-2027" })).resolves.toEqual({ schoolId: "s1", academicYear: "2026-2027", version: 0, allocations: [] });
  apiRequest.mockRejectedValueOnce(new ApiClientError("boom", "HTTP_500", 500));
  await expect(loadSchoolClassSubjects({ schoolId: "s1", academicYear: "2026-2027" })).rejects.toThrow("boom");
});
